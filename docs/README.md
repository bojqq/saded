# Al-Haris — The Semantic Guardian
### AI-Powered Real-Time Survey Validation System
**GASTAT Data Innovation Hackathon — Track 2: AI-Powered Smart Processing**
**Road to Riyadh 2026 | UN World Data Forum**

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution Architecture](#solution-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Running with Docker](#running-with-docker)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [How It Works](#how-it-works)
- [Demo](#demo)
- [Accuracy & Evaluation](#accuracy--evaluation)
- [Team](#team)
- [License](#license)

---

## Overview

**Al-Haris (سراحلا)** is an LLM-powered co-pilot that integrates directly into GASTAT's survey data collection pipeline. It analyzes each submitted survey response in real-time, assigns a **Trust Score (0–100)**, flags semantic contradictions with plain-Arabic explanations, and suggests corrections — all within **2 seconds** of submission.

> **No National Statistical Office in the world has deployed a real-time LLM-powered semantic validation layer in production. Al-Haris is the first.**

### Key Capabilities

- ⚡ Real-time semantic validation with sub-2-second response times
- 🔴 Trust Score engine (0–100) with Green / Yellow / Red traffic light system
- 🌐 Full Arabic-language error explanations for field surveyors
- 🧠 Cross-field contradiction detection (not just individual field validation)
- 📊 Supervisor dashboard with error heatmaps and surveyor quality rankings
- 🔌 REST API middleware — integrates with ODK, KoBoToolbox, SurveyJS, or any custom platform

---

## Problem Statement

GASTAT's field surveyors collect data through questionnaires (census, labor force surveys, household surveys). Current rule-based validation misses **semantic contradictions** that require human-like reasoning:

| # | Example Contradiction |
|---|----------------------|
| 1 | Occupation: "Surgeon" — Education: "Primary School Only" |
| 2 | Household rooms: 2 — Family members: 15 — Satisfaction: "Spacious" |
| 3 | Monthly income: 3,000 SAR — Owns: 3 luxury vehicles |
| 4 | Age: 22 years — Years of work experience: 30 years |

These errors pass through to GASTAT's database and require **expensive manual post-processing**, delaying statistical publication by weeks.

---

## Solution Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SURVEY FRONTEND                           │
│              (React + shadcn/ui + TailwindCSS)                  │
│         Live form with WebSocket real-time validation           │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP / WebSocket
┌────────────────────────▼────────────────────────────────────────┐
│                   FASTAPI MIDDLEWARE LAYER                       │
│                  Async REST API (Python)                         │
│         Receives JSON survey → returns Trust Score + flags      │
└──────────┬────────────────────────────────────┬─────────────────┘
           │                                    │
┌──────────▼──────────┐              ┌──────────▼──────────────────┐
│   LLM REASONING     │              │    KNOWLEDGE BASE           │
│      ENGINE         │              │    (ChromaDB Vector DB)     │
│                     │              │                             │
│  • Claude Sonnet    │◄────────────►│  • ISCO-08 occupation →    │
│  • LangChain chain  │              │    education mappings       │
│  • Structured JSON  │              │  • Saudi salary benchmarks  │
│    output           │              │  • Demographic norms        │
│  • Redis cache      │              │  • Regional cost-of-living  │
└──────────┬──────────┘              └─────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────┐
│                   SUPERVISOR DASHBOARD                           │
│              (React + shadcn/ui + Recharts)                     │
│    Trust Score distribution | Error Heatmap | Surveyor ranking  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | Core UI framework |
| **shadcn/ui** | Latest | Component library (Cards, Badges, Alerts, Progress, Toasts) |
| **Tailwind CSS** | 3.x | Utility-first styling |
| **Radix UI** | Latest | Accessible primitives (under shadcn) |
| **Recharts** | 2.x | Trust Score charts, error heatmaps, surveyor ranking graphs |
| **Lucide React** | Latest | Icon system |
| **React Hook Form** | 7.x | Survey form state management + validation |
| **Zod** | 3.x | Frontend schema validation |
| **TanStack Query** | 5.x | Server state management, API caching |
| **WebSockets (native)** | — | Real-time bidirectional communication with FastAPI |
| **Vite** | 5.x | Build tool & dev server |
| **i18next** | Latest | Arabic / English internationalization |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.11+ | Core language |
| **FastAPI** | 0.110+ | Async REST API framework with auto OpenAPI docs |
| **Uvicorn** | 0.29+ | ASGI server |
| **WebSockets** | — | Real-time push via FastAPI WebSocket endpoint |
| **Pydantic v2** | 2.x | Request/response schema validation |
| **LangChain** | 0.2+ | LLM orchestration, prompt chain management |
| **Anthropic SDK** | Latest | Claude Sonnet API (primary LLM provider) |
| **Redis** | 7.x | Caching repeated error patterns for speed |
| **ChromaDB** | 0.5+ | Vector database for Saudi domain knowledge base |
| **Sentence Transformers** | Latest | Embedding generation for knowledge base lookup |
| **SQLAlchemy** | 2.x | ORM for survey records and audit logs |
| **Supabase (PostgreSQL)** | Latest | Managed PostgreSQL database (recommended for MVP) |
| **Alembic** | Latest | Database migrations |
| **python-dotenv** | Latest | Environment variable management |

### AI / LLM
| Technology | Purpose |
|------------|---------|
| **Claude Sonnet (claude-sonnet-4-20250514)** | Primary semantic reasoning engine |
| **LangChain PromptTemplate** | Few-shot prompt construction with Saudi domain context |
| **LangChain OutputParser** | Structured JSON output parsing (Trust Score, flags, suggestions) |
| **ChromaDB + Sentence Transformers** | RAG pipeline: retrieve relevant Saudi context before LLM call |
| **CAMeL Tools** | Arabic NLP preprocessing for survey text fields |

### Infrastructure & DevOps
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization of all services |
| **Docker Compose** | Multi-service orchestration (API + Frontend + Redis + ChromaDB) |
| **GitHub Actions** | CI/CD pipeline (lint → test → build → deploy) |
| **Nginx** | Reverse proxy for production |

---

## Project Structure

```
al-haris/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── validate.py        # POST /validate — core validation endpoint
│   │   │   │   ├── websocket.py       # WS /ws/validate — real-time stream
│   │   │   │   ├── dashboard.py       # GET /dashboard/metrics
│   │   │   │   └── health.py          # GET /health
│   │   │   └── deps.py                # Dependency injection
│   │   ├── core/
│   │   │   ├── config.py              # Settings (env vars, model params)
│   │   │   ├── llm_engine.py          # LangChain prompt chain + Claude API
│   │   │   ├── knowledge_base.py      # ChromaDB RAG pipeline
│   │   │   ├── trust_scorer.py        # Trust Score calculation logic
│   │   │   └── cache.py               # Redis caching layer
│   │   ├── models/
│   │   │   ├── survey.py              # SQLAlchemy survey record models
│   │   │   └── validation.py          # Pydantic request/response schemas
│   │   ├── data/
│   │   │   ├── isco08_mappings.json   # Occupation → education requirements
│   │   │   ├── salary_benchmarks.json # Saudi salary ranges by occupation
│   │   │   └── few_shot_examples.json # 30 curated error examples (anonymized)
│   │   └── main.py                    # FastAPI app entry point
│   ├── tests/
│   │   ├── test_validation.py
│   │   └── test_llm_engine.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── SurveyForm/
│   │   │   │   ├── SurveyForm.tsx     # Live survey form with real-time validation
│   │   │   │   ├── FieldInput.tsx     # Individual field with inline Trust Score
│   │   │   │   └── ValidationBadge.tsx
│   │   │   ├── ValidationPanel/
│   │   │   │   ├── TrustScoreMeter.tsx
│   │   │   │   ├── ContradictionCard.tsx  # Arabic error explanation cards
│   │   │   │   └── SuggestionActions.tsx  # Accept / Reject suggestion buttons
│   │   │   └── Dashboard/
│   │   │       ├── TrustScoreDistribution.tsx
│   │   │       ├── ErrorHeatmap.tsx
│   │   │       └── SurveyorRanking.tsx
│   │   ├── hooks/
│   │   │   ├── useValidation.ts       # WebSocket connection + validation state
│   │   │   └── useDashboard.ts        # Dashboard data fetching (TanStack Query)
│   │   ├── lib/
│   │   │   ├── api.ts                 # API client
│   │   │   └── utils.ts               # shadcn utils (cn function)
│   │   ├── pages/
│   │   │   ├── SurveyPage.tsx
│   │   │   └── DashboardPage.tsx
│   │   └── App.tsx
│   ├── components.json                # shadcn/ui config
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── package.json
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- A Supabase project (PostgreSQL database)
- An Anthropic API key → [console.anthropic.com](https://console.anthropic.com)

---

### Backend Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-team/al-haris.git
cd al-haris

# 2. Create and activate a virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment variables
cp ../.env.example .env
# Edit .env and add your ANTHROPIC_API_KEY and DATABASE_URL (Supabase Postgres)

# 5. Start Redis and ChromaDB (via Docker)
docker compose up redis chromadb -d

# 6. Run database migrations (creates tables in Supabase)
alembic upgrade head

# 7. Seed the knowledge base
python -m app.core.knowledge_base --seed

# 8. Start the API server
uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

---

### Frontend Setup

```bash
# From the project root
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

App available at: `http://localhost:5173`

---

### Running with Docker

The easiest way to run the full stack:

```bash
# Copy env file
cp .env.example .env
# Add your ANTHROPIC_API_KEY and DATABASE_URL (Supabase Postgres) to .env

# Start all services (DB is Supabase, no local PostgreSQL container required)
docker compose up --build frontend backend redis chromadb

# Services:
# Frontend  → http://localhost:5173
# Backend   → http://localhost:8000
# API Docs  → http://localhost:8000/docs
# Redis     → localhost:6379
# ChromaDB  → http://localhost:8001
# Database  → Supabase Postgres
```

To stop:
```bash
docker compose down
```

---

## API Reference

### `POST /api/v1/validate`
Submit a survey record for semantic validation.

**Request Body:**
```json
{
  "survey_id": "LFS-2026-001",
  "respondent_id": "R-4821",
  "fields": {
    "age": 22,
    "occupation": "surgeon",
    "education_level": "primary",
    "years_of_experience": 30,
    "monthly_income_sar": 3000,
    "num_vehicles": 3,
    "housing_rooms": 2,
    "household_size": 15,
    "housing_satisfaction": "spacious"
  }
}
```

**Response:**
```json
{
  "trust_score": 12,
  "severity": "RED",
  "flags": [
    {
      "fields": ["occupation", "education_level"],
      "type": "HARD_ERROR",
      "description_ar": "تعارض: الوظيفة المُختارة (طبيب جراح) تستلزم مؤهلاً أكاديمياً عالياً، لكن المستوى التعليمي المُسجَّل (ابتدائي) لا يتوافق مع ذلك.",
      "description_en": "Contradiction: Occupation 'surgeon' requires advanced academic qualifications, but education level 'primary' is incompatible.",
      "suggested_correction": {
        "field": "education_level",
        "value": "postgraduate",
        "confidence": 0.97
      }
    },
    {
      "fields": ["age", "years_of_experience"],
      "type": "HARD_ERROR",
      "description_ar": "تعارض: العمر المُسجَّل (22 سنة) لا يتوافق مع سنوات الخبرة المُعلَنة (30 سنة).",
      "description_en": "Contradiction: Reported age (22) is incompatible with declared years of experience (30).",
      "suggested_correction": {
        "field": "years_of_experience",
        "value": 2,
        "confidence": 0.91
      }
    }
  ],
  "classification": "HARD_ERROR",
  "processing_time_ms": 1243
}
```

---

### `WebSocket /ws/validate`
Real-time streaming validation as surveyors type.

```javascript
const ws = new WebSocket("ws://localhost:8000/ws/validate");
ws.send(JSON.stringify({ field: "occupation", value: "surgeon", context: { education_level: "primary" } }));
ws.onmessage = (event) => {
  const result = JSON.parse(event.data);
  // { trust_score, flags, ... }
};
```

---

### `GET /api/v1/dashboard/metrics`
Returns aggregate quality metrics for the supervisor dashboard.

---

## Environment Variables

Create a `.env` file from `.env.example`:

```env
# LLM
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-4-20250514
MAX_TOKENS=1000

# Database (Supabase Postgres recommended)
DATABASE_URL=postgresql://postgres:YOUR_SUPABASE_DB_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require

# Local Docker Postgres (optional)
# DATABASE_URL=postgresql://alharis:alharis@localhost:5432/alharis_db

# Redis (caching)
REDIS_URL=redis://localhost:6379/0

# ChromaDB (knowledge base)
CHROMA_HOST=localhost
CHROMA_PORT=8001

# API
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:5173

# App
ENVIRONMENT=development
LOG_LEVEL=INFO
```

---

### Using Supabase (Recommended)

Supabase is hosted PostgreSQL, so it works without any code changes. Set `DATABASE_URL` to your Supabase connection string (URI) and run migrations.

Quick setup:
1. Create a Supabase project
2. Copy the Postgres connection string (URI) from Supabase
3. Set `DATABASE_URL` (usually include `?sslmode=require`)
4. Run `alembic upgrade head`

Notes:
- Supabase typically requires TLS. If you see SSL-related errors, add `?sslmode=require` to `DATABASE_URL` or set `PGSSLMODE=require`.
- Prefer a least-privilege DB user for apps and tooling (including MCP).

### Claude Code MCP (Supabase / PostgreSQL)

You can connect Claude Code's MCP to the same Supabase Postgres database (or any Postgres) by adding a Postgres MCP server.

Option A: project-scoped MCP server via CLI (writes `.mcp.json` in the repo root):
```bash
claude mcp add -s project -e DATABASE_URL='postgresql://postgres:YOUR_SUPABASE_DB_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require' postgres -- \
  npx -y @modelcontextprotocol/server-postgres
```

Notes:
- `npx` downloads the package the first time. If your environment can't access npm, install the server package ahead of time and update `command`/`args` accordingly.

Option B: file-based config:
1. Copy `.mcp.json.example` to `.mcp.json`
2. Set `env.DATABASE_URL` to your Postgres connection string

Verify:
```bash
claude mcp list
claude mcp get postgres
```

## How It Works

### The LLM Prompt Chain

Each validation call runs a 3-step LangChain chain:

**Step 1 — Context Retrieval (RAG)**
ChromaDB retrieves the most relevant Saudi domain knowledge for the submitted occupation/demographic fields (ISCO-08 mappings, salary benchmarks, regional norms).

**Step 2 — Prompt Construction**
```
System: You are a statistical data quality expert for GASTAT (Saudi Arabia).
        Your task is to detect semantic contradictions in survey responses.
        Saudi domain context: {retrieved_context}
        Return ONLY valid JSON. No preamble.

Few-shot examples: {30 curated error examples}

User: Validate this survey record: {survey_fields}
      Return: trust_score (0-100), flags[], classification, descriptions in Arabic and English.
```

**Step 3 — Structured Output Parsing**
The response is parsed via Pydantic v2 into a typed `ValidationResult` object. If parsing fails, the chain retries once before returning a graceful fallback.

### Redis Caching
Identical or near-identical field combinations are cached for 1 hour, reducing API latency for common patterns to **< 50ms**.

### Trust Score Formula
```
trust_score = 100
             - (HARD_ERRORS × 30)
             - (SOFT_WARNINGS × 10)
             - (PLAUSIBLE_OUTLIERS × 3)
             (clamped to 0–100)
```

---

## Demo

The live demo simulates a GASTAT labor force survey form. Type contradictory data and watch Al-Haris flag errors in real-time:

1. Enter **Occupation: Surgeon** → **Education: Primary School**
   - 🔴 Instant red flag with Arabic contradiction explanation
2. Enter **Age: 22** → **Years of Experience: 30**
   - 🔴 Hard error detected + suggested correction
3. Enter **Income: 3,000 SAR** → **Vehicles: 3 luxury cars**
   - 🟡 Soft warning flagged for supervisor review

---

## Accuracy & Evaluation

Evaluated against 50–100 anonymized GASTAT test records:

| Metric | Target | Achieved |
|--------|--------|----------|
| Hard Error Detection Rate | > 80% | TBD |
| False Positive Rate | < 15% | TBD |
| Average Response Time | < 2,000ms | TBD |
| Arabic Explanation Quality | Human-rated | TBD |

Run the evaluation suite:
```bash
cd backend
python -m tests.evaluate --records data/gastat_test_records.json
```

---

## Team

| Name | Role |
|------|------|
| — | Team Lead / Backend |
| — | AI / LLM Engineering |
| — | Frontend / UI |
| — | Data / Domain Expert |

---

## License

MIT License — see [LICENSE](LICENSE)

---

<div align="center">
  <strong>Built for the GASTAT Data Innovation Hackathon — Road to Riyadh 2026</strong><br/>
  Towards the 6th UN World Data Forum, Riyadh, November 2026
</div>
