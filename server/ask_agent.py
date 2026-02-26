from typing import TypedDict, List
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
    passages = [r["text"] for r in results if r["_distance"] < 0.7] 
    print("PASSAGES: ------------------------")
    print("PASSAGES: ")
    print(len(passages))
    for r in results:
        print(f"distance: {r['_distance']:.4f} | {r['text'][:80]}")
    return {"retrieved_passages": passages}


def llm_answer_node(state: AgentState) -> dict:
    query = state["user_query"]
    context = "\n\n".join(state["retrieved_passages"])
    prompt = (
        f"You are an assistant answering questions about a software engineer's work experience. "
        f"Answer using only the context below.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {query}\nAnswer:"
    )
    # response = hf_client.chat_completion(
    #     model=LLM_MODEL,
    #     messages=[{"role": "user", "content": prompt}],
    #     max_tokens=512,
    # )
    client = get_llm_client()
    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=512,
    )
    
    return {"answer": response.choices[0].message.content}
    # return {"answer": 'placeholder answer'}

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
def run_agent(user_query: str) -> str:
    result = graph.invoke({"user_query": user_query})
    return result.get("answer", "")
