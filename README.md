# Legal Mitra — AI Legal Assistance Platform

AI-powered legal guidance for Indian citizens. Upload documents, detect fraud, get AI legal guidance, and connect with lawyers — available in English, Hindi & Marathi.

> **Disclaimer:** AI-generated guidance, not a substitute for a qualified lawyer.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)              │
│  ┌──────┐ ┌────────┐ ┌────┐ ┌────────┐ ┌──────┐     │
│  │Summ. │ │Health  │ │Q&A │ │Notice  │ │Speech│ ... │
│  │Page  │ │Check   │ │Chat│ │Detect  │ │Page  │     │
│  └──┬───┘ └───┬────┘ └─┬──┘ └───┬────┘ └──┬───┘     │
│     └─────────┴────────┴────────┴─────────┘          │
│                  REST API calls                       │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│                 Backend (FastAPI)                      │
│  ┌─────────────────────────────────┐                  │
│  │         /v1 API Routes          │                  │
│  └──┬──────────┬──────────┬────────┘                  │
│     │          │          │                           │
│  ┌──▼──┐   ┌──▼────┐  ┌──▼──────┐                    │
│  │ml-  │   │domain-│  │shared-  │                    │
│  │core │   │rules  │  │schemas  │                    │
│  └──┬──┘   └───────┘  └─────────┘                    │
│     │                                                │
│  ┌──▼──────┐  ┌─────────┐  ┌──────────┐              │
│  │ FAISS   │  │ DuckDB  │  │ Lawyers  │              │
│  │ Vector  │  │ Store   │  │ CSV+Dir  │              │
│  └─────────┘  └─────────┘  └──────────┘              │
└──────────────────────────────────────────────────────┘
```

## Modules (8 Pages)

| # | Module | Route | Description |
|---|--------|-------|-------------|
| 1 | Document Summarizer | `/summarizer` | Upload PDF/TXT, get summary + obligations + deadlines |
| 2 | Legal Health Check | `/health-check` | Risk score, risky clauses, missing sections |
| 3 | AI Legal Q&A | `/qa` | RAG-based chat with document context & memory |
| 4 | Fake Notice Detector | `/notice-detector` | Fraud pattern detection in legal notices |
| 5 | Speech-to-Legal Advice | `/speech` | Microphone + transcript to legal guidance |
| 6 | Dispute Predictor | `/dispute` | Win probability based on case parameters |
| 7 | Lawyer Recommendation | `/lawyers` | Search, compare fees, book consultations |
| 8 | Fraud Community Detector | `/fraud` | Report scams + community alert patterns |

Additional pages: `/track` (booking tracker), `/admin/bookings` (admin view), `/workspace` (module index)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS v4, Lucide icons |
| Backend | FastAPI, Uvicorn, Pydantic |
| Storage | DuckDB (structured data), FAISS (vector search) |
| AI | Rule-based + LLM-ready (LangChain, Groq, Gemini compatible) |
| PDF | PyPDF, PyMuPDF |

## Project Structure

```
legal-mitra/
├── apps/
│   ├── api/                    # FastAPI backend
│   │   └── legal_mitra_api/
│   │       ├── api/routes.py   # All v1 REST endpoints
│   │       ├── core/bootstrap.py
│   │       ├── services/registry.py
│   │       └── tests/
│   └── web/                    # Next.js frontend
│       ├── app/
│       │   ├── page.tsx        # Landing page
│       │   ├── summarizer/     # Module 1
│       │   ├── health-check/   # Module 2
│       │   ├── qa/             # Module 3
│       │   ├── notice-detector/# Module 4
│       │   ├── speech/         # Module 5
│       │   ├── dispute/        # Module 6
│       │   ├── lawyers/        # Module 7
│       │   ├── fraud/          # Module 8
│       │   ├── track/          # Booking tracker
│       │   └── admin/bookings/ # Admin view
│       ├── components/
│       └── lib/api.ts
├── packages/
│   ├── ml-core/          # ML: embeddings, FAISS, DuckDB, QA, predictors
│   ├── domain-rules/     # Legal heuristics and rules
│   └── shared-schemas/   # Pydantic models
├── datasets/
│   └── raw/lawyers/      # 30 lawyers with coordinates
├── artifacts/            # Runtime: FAISS index, DuckDB, uploads
├── scripts/              # bootstrap, run scripts
├── .env.example          # Environment template
├── pyproject.toml        # Python config
└── package.json          # Node workspace
```

## Quickstart

### 1. Install dependencies

```bash
# Python
pip install -r requirements.txt

# Node
cd apps/web && npm install
```

Or use the bootstrap script:

```bash
./scripts/bootstrap.sh
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your API keys (optional — works without them)
```

### 3. Start backend

```bash
./scripts/run_api.sh
# or manually:
API_RELOAD=1 ./scripts/run_api.sh
```

### 4. Start frontend

```bash
./scripts/run_web.sh
# or manually:
cd apps/web && npm run dev
```

### 5. Open

- **Web UI:** http://localhost:3000
- **API Docs:** http://localhost:8000/docs

## API Endpoints

```
POST /v1/docs/upload              Upload & analyze document
POST /v1/summarize                Summarize text
POST /v1/legal-health/analyze     Legal health check
POST /v1/notice/verify            Fake notice detection
POST /v1/dispute/predict          Dispute outcome prediction
POST /v1/speech/analyze           Speech intent analysis
POST /v1/qa/ask                   RAG Q&A with memory
GET  /v1/lawyers/search           Search lawyers
POST /v1/lawyers/bookings         Create booking
GET  /v1/lawyers/bookings/:id     Track booking
POST /v1/fraud/report             Report fraud
GET  /v1/fraud/alerts             Community alerts
GET  /v1/health                   Health check
GET  /v1/stats                    System stats
```

## Lawyer Data

30 dummy lawyers across major Indian cities with coordinates:
Pune, Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Kolkata, Ahmedabad, Jaipur, Lucknow, Kochi, Nagpur, Bhopal, Indore, Patna, Chandigarh, Varanasi

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_HOST` | Backend host | `127.0.0.1` |
| `API_PORT` | Backend port | `8000` |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend API URL | `http://127.0.0.1:8000/v1` |
| `GROQ_API_KEY` | Groq LLM key | (optional) |
| `GOOGLE_API_KEY` | Gemini key | (optional) |
| `EMBEDDING_PROVIDER` | `hash` or `sentence-transformers` | `hash` |
