from typing import TypedDict, List, AsyncGenerator
from pathlib import Path
import asyncio
import json
import re

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

# Reuse shared setup from ask_agent to avoid re-initialising the embedding model
from ask_agent import get_llm_client, table, Settings, _clean_passage, LLM_MODEL


# --- State ---
class AssessState(TypedDict):
    raw_jd: str                   # raw input, hard-truncated to 3000 chars
    jd_signals: str               # compact LLM-extracted requirements (~100 words)
    query_embedding: List[float]
    retrieved_passages: List[str]
    assessment: dict              # parsed final result


# --- Fallback ---
_ASSESS_FALLBACK = {
    "fit_percentage": 0,
    "good_fit": [],
    "mismatches": ["Assessment unavailable — please try again"],
    "recommendation": "",
}


# --- Nodes ---

def extract_jd_signals_node(state: AssessState) -> dict:
    """Distil the (potentially very long) JD into a compact signal string for embedding."""
    raw = state["raw_jd"][:3000]

    system_prompt = (
        "You are a technical job description analyzer. "
        "Extract the key technical requirements from the job description provided. "
        "Output a single compact paragraph (100 words maximum) summarizing: "
        "required programming languages, frameworks, tools, years of experience, "
        "seniority level, domain (e.g. frontend, backend, ML), and key responsibilities. "
        "Do not include company name, benefits, or non-technical information. "
        "Output only the summary paragraph, nothing else."
    )

    client = get_llm_client()
    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": raw},
        ],
        max_tokens=150,
        temperature=0,
    )

    signals = response.choices[0].message.content.strip()
    print(f"ASSESS SIGNALS: {signals[:120]}")
    return {"jd_signals": signals}


def embed_and_search_node(state: AssessState) -> dict:
    """Embed the signal string and retrieve relevant CV passages from LanceDB."""
    prefixed = f"Represent this sentence for searching relevant passages: {state['jd_signals']}"
    embedding = Settings.embed_model.get_text_embedding(prefixed)

    results = table.search(embedding).limit(15).to_list()

    seen: set = set()

    def deduplicate(rows, max_dist, min_words):
        out = []
        for r in rows:
            t = _clean_passage(r["text"])
            if r["_distance"] < max_dist and len(t.split()) >= min_words and t not in seen:
                seen.add(t)
                out.append(t)
        return out

    passages = deduplicate(results, 0.85, 4)
    if len(passages) < 3:
        passages = deduplicate(results, 1.1, 2)

    print(f"ASSESS PASSAGES: {len(passages)}")
    for r in results[:5]:
        print(f"  dist={r['_distance']:.4f} | {r['text'][:70]}")

    return {"query_embedding": embedding, "retrieved_passages": passages}


def llm_assess_node(state: AssessState) -> dict:
    """Compare retrieved passages against the JD and return a structured assessment."""
    if not state["retrieved_passages"]:
        return {"assessment": _ASSESS_FALLBACK}

    context = "\n\n".join(state["retrieved_passages"])

    system_prompt = (
        "You are an objective technical recruiter assistant performing a fit assessment.\n\n"
        "You will be given:\n"
        "1. CANDIDATE PROFILE: Retrieved passages from Bart Dority's CV, project write-ups, "
        "skills documentation, and experience records.\n"
        "2. JOB DESCRIPTION: Key signals extracted from a job posting, plus the original text.\n\n"
        "Your task: Assess how well Bart fits this role.\n\n"
        "RULES:\n"
        "- Base your assessment ONLY on the candidate profile passages provided. "
        "Do not infer skills not evidenced in the passages.\n"
        "- fit_percentage: integer 0-100. Be honest and calibrated. "
        "90+ means near-perfect match. 70-89 means strong match with minor gaps. "
        "50-69 means solid partial match. Below 50 means significant gaps.\n"
        "- good_fit: list of up to 4 short strings (max 10 words each) describing "
        "specific areas where Bart's documented experience matches this role's requirements.\n"
        "- mismatches: list of up to 4 short strings (max 10 words each) describing "
        "specific requirements in the JD that are NOT evidenced in Bart's profile. "
        "If there are no mismatches, return an empty list.\n"
        "- recommendation: 2-3 sentences summarising the overall fit. Be direct and honest. "
        "State the strongest reason to proceed or not, and whether Bart is worth pursuing for this role. "
        "Write as if advising a hiring manager.\n\n"
        "OUTPUT FORMAT — You MUST respond with ONLY a valid JSON object. "
        "No markdown. No explanation. No code fences. Begin your response with { and end with }.\n\n"
        'Required schema: {"fit_percentage": <integer>, "good_fit": [<string>, ...], "mismatches": [<string>, ...], "recommendation": <string>}\n\n'
        f"--- CANDIDATE PROFILE ---\n{context}\n--- END CANDIDATE PROFILE ---"
    )

    user_message = (
        f"Job Description Signals:\n{state['jd_signals']}\n\n"
        f"Full Job Description (additional context):\n{state['raw_jd'][:2000]}"
    )

    client = get_llm_client()
    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        max_tokens=700,
        temperature=0,
    )

    raw = response.choices[0].message.content.strip()
    print(f"ASSESS RAW: {raw[:200]}")
    assessment = _parse_assessment(raw)
    return {"assessment": assessment}


def _parse_assessment(raw: str) -> dict:
    """Robust JSON parsing with three-layer defence. Never raises."""
    text = raw.strip()

    # Strip markdown fences
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    text = text.strip()

    # Extract first {...} block
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        text = match.group(0)

    try:
        data = json.loads(text)
    except (json.JSONDecodeError, ValueError):
        print(f"ASSESS: JSON parse failed. Raw: {raw[:200]}")
        return _ASSESS_FALLBACK

    # Clamp and sanitise
    fit = data.get("fit_percentage", 0)
    if not isinstance(fit, (int, float)):
        fit = 0
    fit = max(0, min(100, int(fit)))

    good_fit = data.get("good_fit", [])
    if not isinstance(good_fit, list):
        good_fit = []
    good_fit = [str(x) for x in good_fit[:4]]

    mismatches = data.get("mismatches", [])
    if not isinstance(mismatches, list):
        mismatches = []
    mismatches = [str(x) for x in mismatches[:4]]

    recommendation = data.get("recommendation", "")
    if not isinstance(recommendation, str):
        recommendation = ""

    return {"fit_percentage": fit, "good_fit": good_fit, "mismatches": mismatches, "recommendation": recommendation}


# --- Public streaming interface ---

async def stream_assess_response(job_description: str) -> AsyncGenerator[str, None]:
    """Async generator yielding SSE-formatted strings. Final event is type='result'."""

    def sse(payload: dict) -> str:
        return f"data: {json.dumps(payload)}\n\n"

    jd = job_description.strip()
    if len(jd) < 50:
        yield sse({"type": "error", "text": "Job description is too short to assess."})
        return

    state: AssessState = {
        "raw_jd": jd[:3000],
        "jd_signals": "",
        "query_embedding": [],
        "retrieved_passages": [],
        "assessment": {},
    }

    try:
        yield sse({"type": "status", "text": "Parsing job description..."})
        result = await asyncio.to_thread(extract_jd_signals_node, state)
        state = {**state, **result}

        yield sse({"type": "status", "text": "Searching CV against 11 documents..."})
        result = await asyncio.to_thread(embed_and_search_node, state)
        state = {**state, **result}

        yield sse({"type": "status", "text": "Running fit assessment..."})
        result = await asyncio.to_thread(llm_assess_node, state)
        state = {**state, **result}

        yield sse({"type": "result", "data": state["assessment"]})
        yield sse({"type": "done"})

    except Exception as e:
        print(f"ASSESS ERROR: {e}")
        yield sse({"type": "error", "text": "Assessment service unavailable — please try again."})
