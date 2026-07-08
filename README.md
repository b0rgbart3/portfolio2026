# Portfolio 2026

An AI-powered portfolio website featuring an interactive chat interface backed by a LangGraph RAG pipeline. Visitors can explore work experience and ask questions that are answered using context retrieved from indexed career documents.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | SCSS Modules + Framer Motion |
| Backend | Python + FastAPI + Uvicorn |
| AI Workflow | LangGraph (state machine RAG agent) |
| Vector DB | LanceDB (local) |
| Embeddings | HuggingFace `BAAI/bge-small-en-v1.5` |
| LLM | OpenAI API |

---

## Project Structure

```
portfolio2026/
├── client/                   # React + TypeScript frontend
│   ├── src/
│   │   ├── components/       # UI components (Navbar, Hero, Experience, etc.)
│   │   ├── styles/           # Global SCSS
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── vite.config.ts
│   └── package.json
│
├── server/                   # Python FastAPI backend
│   ├── main.py               # FastAPI app entry point
│   ├── ask_agent.py          # LangGraph AI agent
│   ├── pdf_injest.py         # PDF document ingestion
│   ├── review_injestion.py   # Review document ingestion
│   ├── test_vector_search.py # Vector search tests
│   ├── lancedb/              # Local vector database
│   ├── documents/            # Source PDFs for ingestion
│   └── requirements.txt      # Python dependencies
│
└── .venv/                    # Python virtual environment
```

---

## Prerequisites

- **Node.js** v18+
- **Python** 3.10+
- **pip** or a compatible package manager

---

## Environment Variables

Create a `.env` file inside the `server/` directory:

```env
HF_TOKEN=your_huggingface_api_token
OPENAI_API_KEY=your_openai_api_key
```

---

## Client — Development

```bash
cd client
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` with Hot Module Replacement enabled.

Other client scripts:

```bash
npm run build    # Type-check and build for production (output: client/dist/)
npm run preview  # Preview the production build locally
npm run lint     # Run ESLint
```

---

## Server — Setup

```bash
cd server
python -m venv ../.venv          # Create virtual environment (from server/ dir)
source ../.venv/bin/activate     # macOS/Linux
# ..\\.venv\\Scripts\\activate   # Windows

pip install -r requirements.txt
```

### Ingest Documents

Before starting the server for the first time, index your source PDFs into LanceDB:

```bash
python pdf_injest.py
```

### Run the Server

```bash
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`. Pass `--reload` to enable auto-restart on file changes during development.

---

## Production

### 1. Build the frontend

```bash
cd client
npm run build
```

Static files are output to `client/dist/`.

### 2. Serve static files via FastAPI

FastAPI's `main.py` is configured to serve the built frontend. Start the server without `--reload` and bind to a port:

```bash
cd server
source ../.venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

The full application (frontend + API) is then available at `http://localhost:8000`.

---

## Frontend Architecture

### Component Structure

Each UI component lives in its own folder with a co-located SCSS Module:

```
components/
├── Hero/
│   ├── Hero.tsx
│   └── Hero.module.scss
├── Navbar/
│   ├── Navbar.tsx
│   └── Navbar.module.scss
└── ...
```

Styles are scoped via CSS Modules (`import styles from './Component.module.scss'`), eliminating class name collisions without a CSS-in-JS runtime.

### Custom Hooks

| Hook | File | Purpose |
|---|---|---|
| `useTheme` | `src/utils/useTheme.ts` | Dark/light mode toggle — reads/persists preference and applies a `data-theme` attribute |

### Animation Patterns (framer-motion)

- `motion.*` components (`motion.div`, `motion.button`, etc.) for declarative enter/exit/hover animations
- `AnimatePresence` — mounts/unmounts children with animated transitions; used with `mode="wait"` for sequential swaps and `initial={false}` to suppress entry animations on first render
- `useInView` — triggers animations when elements scroll into the viewport

### Portals

`createPortal` (from `react-dom`) is used to render overlay elements (e.g. the AI panel) outside the component tree, avoiding z-index and overflow stacking issues.

### Data Layer

Project content is loaded from a static JSON file (`src/data/projects.json`) rather than hardcoded in components, keeping data and presentation separate.

---

## AI Workflow

The LangGraph agent in `server/ask_agent.py` implements a four-node RAG pipeline:

```
User Query
    │
    ▼
rewrite_query_node     ← Resolves pronouns and disambiguates follow-up questions
    │
    ▼
embed_query_node       ← HuggingFace BAAI/bge-small-en-v1.5
    │
    ▼
vector_search_node     ← LanceDB cosine similarity search (top 10, deduplicated)
    │
    ▼
llm_answer_node        ← LLM with retrieved context and grounding system prompt
    │
    ▼
Answer
```

State is managed via a typed `AgentState` dict passed through each node.

---

## Streaming Response

The chatbot uses **Server-Sent Events (SSE)** to stream responses progressively instead of waiting for the full pipeline to complete.

### How it works

The frontend posts to `POST /api/ask/stream`. The server streams a sequence of JSON events over a long-lived HTTP connection:

```
data: {"type": "status", "text": "Refining your question..."}
data: {"type": "status", "text": "Searching knowledge base..."}
data: {"type": "status", "text": "Retrieving relevant context..."}
data: {"type": "status", "text": "Generating answer..."}
data: {"type": "token",  "text": "Bart "}
data: {"type": "token",  "text": "has extensive"}
...
data: {"type": "done"}
```

| Event type | Description |
|---|---|
| `status` | Pipeline stage label shown in the typing indicator |
| `token` | A token chunk from the LLM, appended to the live response bubble |
| `done` | Stream complete — client finalises the message |
| `error` | Unrecoverable error during pipeline setup |

### Implementation notes

- **Backend** (`ask_agent.py`): `stream_agent_response()` is an async generator that runs the first three pipeline nodes via `asyncio.to_thread()` (to avoid blocking the event loop), then streams LLM tokens using a thread + queue bridge around the OpenAI SDK's synchronous streaming iterator.
- **Frontend** (`AIPanel.tsx`): Uses the Fetch API's `ReadableStream` with a `TextDecoder` and a buffer to handle SSE line parsing across chunk boundaries. The typing status bubble cycles through stage labels until the first token arrives, at which point the live response bubble appears and fills in word by word.
- **Backward compatible**: The original `POST /api/ask` endpoint is unchanged.

---

## Key Dependencies

### Frontend (`client/package.json`)

| Package | Purpose |
|---|---|
| `react` / `react-dom` | UI framework |
| `framer-motion` | Animations |
| `lucide-react` | Icons |
| `sass` | SCSS preprocessing |
| `vite` | Build tool |
| `typescript` | Type safety |

### Backend (`server/requirements.txt`)

| Package | Purpose |
|---|---|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server |
| `langgraph` | AI workflow orchestration |
| `langchain-core` | LLM integration |
| `lancedb` | Local vector database |
| `llama-index-*` | Document indexing and retrieval |
| `sentence-transformers` | Embedding model |
| `openai` | LLM API client |
| `python-dotenv` | Environment variable loading |
| `pypdf` | PDF parsing |
