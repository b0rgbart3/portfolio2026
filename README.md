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

## AI Workflow

The LangGraph agent in `server/ask_agent.py` implements a three-node RAG pipeline:

```
User Query
    │
    ▼
embed_query_node       ← HuggingFace BAAI/bge-small-en-v1.5
    │
    ▼
vector_search_node     ← LanceDB similarity search (top 5, distance < 0.7)
    │
    ▼
llm_answer_node        ← OpenAI LLM with retrieved context
    │
    ▼
Answer
```

State is managed via a typed `AgentState` dict passed through each node.

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
