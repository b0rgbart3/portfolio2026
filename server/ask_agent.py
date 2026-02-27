from typing import TypedDict, List, Dict
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

import lancedb
from langgraph.graph import StateGraph, END
from llama_index.core import Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
import os
from huggingface_hub import InferenceClient

from langchain_community.chat_models import ChatOllama


LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
LLM_MODEL = os.getenv("LLM_MODEL", "llama3.1:8b")

print("PROVIDER: ")
print(LLM_PROVIDER)
print("MODEL:")
print(LLM_MODEL)


def get_llm_client():
    if LLM_PROVIDER == "ollama":
        from openai import OpenAI

        return OpenAI(
            base_url="http://localhost:11434/v1",
            api_key="ollama",  # dummy value
        )

    elif LLM_PROVIDER == "openrouter":
        from openai import OpenAI

        return OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        )

    else:
        raise ValueError(f"Unsupported LLM provider: {LLM_PROVIDER}")

# llm = ChatOllama(
#     model="llama3.1:8b",
#     temperature=0
# )


# --- Config ---
LANCE_DB_PATH = "lancedb"
TABLE_NAME = "documents"
EMBED_MODEL_NAME = "BAAI/bge-small-en-v1.5"
# LLM_MODEL = "openai/gpt-5.2-codex"

# --- Init ---
Settings.embed_model = HuggingFaceEmbedding(model_name=EMBED_MODEL_NAME)
db = lancedb.connect(LANCE_DB_PATH)
table = db.open_table(TABLE_NAME)
hf_client = InferenceClient(token=os.environ["HF_TOKEN"])


# --- State ---
class AgentState(TypedDict):
    user_query: str
    history: List[Dict[str, str]]
    query_embedding: List[float]
    retrieved_passages: List[str]
    answer: str


# --- Nodes ---
def embed_query_node(state: AgentState) -> dict:
    embedding = Settings.embed_model.get_text_embedding(state["user_query"])
    print("QUERY EMBEDDING: ")
    print(state["user_query"])
    print("--------------------------")
    return {"query_embedding": embedding}


def vector_search_node(state: AgentState) -> dict:
    results = table.search(state["query_embedding"]).limit(5).to_list()
    passages = [r["text"] for r in results if r["_distance"] < 0.85 and len(r["text"].split()) >= 4]
    print("PASSAGES: ------------------------")
    print("PASSAGES: ")
    print(len(passages))
    for r in results:
        print(f"distance: {r['_distance']:.4f} | {r['text'][:80]}")
    return {"retrieved_passages": passages}


def llm_answer_node(state: AgentState) -> dict:
    query = state["user_query"]
    history = state.get("history", [])
    default_response = "I'm sorry I don't have enough relevant information to answer your question accurately. Care to reframe or add more context so I can better assist you?"
    default_closing_response = "I'm sorry I'm not able to answer your question with relevant information.  Please try asking another question."
    if len(state["retrieved_passages"]) < 1 and len(history) < 1:
        return {"answer": default_response}

    context = "\n\n".join(state["retrieved_passages"])
    
    system_message = {
        "role": "system",
        "content": (
            "You are Bart's technical advocate. Answer questions about Bart based strictly on the retrieved facts below.\n\n"
            "STRICT RULES — follow these exactly:\n"
            "- Use ONLY information explicitly stated in the retrieved facts. Do not infer, extrapolate, or add context not present in the facts.\n"
            "- Do NOT add analysis, opinions, implications, risks, or characterizations that are not directly quoted from the facts.\n"
            "- Do NOT speculate about why Bart made decisions or what the consequences of those decisions were unless explicitly stated.\n"
            "- If a detail is not in the retrieved facts, omit it entirely — do not fill gaps with general knowledge.\n\n"
            "Style:\n"
            "- Be concise. Answers should be at most two sentences.\n"
            "- Refer to Bart by name.\n"
            "- Use technical terms from the facts where relevant.\n\n"
            f"If the answer is not in the retrieved facts, say exactly: {default_response}\n\n"
            f"RETRIEVED FACTS ABOUT BART (use only these):\n{context}"
        ),
    }

    messages = [system_message, *history, {"role": "user", "content": query}]

    client = get_llm_client()
    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=messages,
        max_tokens=512,
        temperature=0,
    )

    return {"answer": response.choices[0].message.content}

# --- Build graph ---
builder = StateGraph(AgentState)
builder.add_node("embed_query", embed_query_node)
builder.add_node("vector_search", vector_search_node)
builder.add_node("llm_answer", llm_answer_node)
builder.set_entry_point("embed_query")
builder.add_edge("embed_query", "vector_search")
builder.add_edge("vector_search", "llm_answer")
builder.add_edge("llm_answer", END)
graph = builder.compile()


# --- Public interface ---
def run_agent(user_query: str, history: List[Dict[str, str]] = []) -> str:
    result = graph.invoke({"user_query": user_query, "history": history})
    return result.get("answer", "")
