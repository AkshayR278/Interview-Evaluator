# AI-Powered Interview Evaluation System

An AI-powered interview evaluation platform built with **Python, FastAPI, PostgreSQL, SQLAlchemy, Pydantic, and Gemini LLMs**.

The project is being developed as an end-to-end system that can generate technical interview questions, collect candidate responses, evaluate answers using an LLM, and eventually produce a structured interview report through a user-facing application.

> **Project Status:** 🚧 In Development
> The core backend, database layer, CRUD APIs, Gemini-based question generation, and LLM-based answer evaluation are implemented and tested. Report generation, audio input, frontend, authentication, and deployment are still planned.

---

## Overview

Currently implemented backend flow:

```text
Candidate
    ↓
Interview
    ↓
Question ← Gemini
    ↓
Response
    ↓
Gemini Evaluation
    ↓
Evaluation
    ↓
PostgreSQL
```

---

## Current Features

### Backend

- FastAPI application with modular API routers
- RESTful CRUD APIs
- Pydantic request and response schemas
- PostgreSQL database
- SQLAlchemy ORM
- Foreign-key relationships
- Bidirectional SQLAlchemy relationships using `back_populates`
- Database transaction handling
- HTTP error handling and resource validation
- Swagger/OpenAPI API testing

### Interview Management

- Candidate CRUD
- Interview CRUD
- Question CRUD
- Response CRUD
- Evaluation CRUD

### AI Question Generation

Gemini is integrated into the interview-question workflow.

The system can:

1. Retrieve an interview.
2. Read the interview role and company.
3. Send the context to Gemini.
4. Generate structured technical interview questions.
5. Validate the LLM output with Pydantic.
6. Store the generated questions in PostgreSQL.

Endpoint:

```text
POST /interviews/{id}/generate-questions
```

### AI Answer Evaluation

The system can evaluate an existing candidate response using Gemini.

A client requests evaluation for a stored response:

```text
POST /responses/{id}/generate-evaluation
```

The backend does not trust the client to provide the question or answer — instead:

```text
Response ID
    ↓
Query PostgreSQL → Response object (question_id, answer)
    ↓
Query associated Question
    ↓
Question + Candidate Answer → Gemini
    ↓
Structured GeneratedEvaluation (Pydantic)
    ↓
Evaluation SQLAlchemy model
    ↓
PostgreSQL
```

This makes the database the source of truth for the question and candidate answer — the LLM output is parsed into a Pydantic model rather than treated as arbitrary text, then persisted as the `Evaluation` model.

The LLM evaluates the response using:

- Accuracy
- Relevance
- Technical quality
- Grammar
- Confidence
- Filler-word count
- Feedback
- Strengths

Scores are constrained to a `0–100` range at the database level.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| **Python** | Core programming language |
| **FastAPI** | Backend REST API |
| **Pydantic** | Request validation and structured LLM output |
| **PostgreSQL** | Relational database |
| **SQLAlchemy** | ORM and database interaction |
| **Gemini LLM** | Question generation and answer evaluation |
| **Swagger / OpenAPI** | API testing and documentation |
| **pgAdmin** | PostgreSQL database inspection |
| **Git / GitHub** | Version control |

---

## Data Model

```text
Candidate ──1:many──▶ Interview ──1:many──▶ Question ──1:many──▶ Response ──▶ Evaluation
```

**Candidate** — the person participating in an interview.

**Interview** — stores candidate, company, and role.

**Question**
```text
id · interview_id · question
```

**Response**
```text
id · question_id · answer
```
The answer can be empty/null so that skipped questions can be represented separately from answered questions.

**Evaluation**
```text
id · response_id · accuracy_score · relevance_score · technical_score
grammar_score · confidence_score · filler_word_count · feedback · strengths
```

---

## API Structure

```text
app/
├── api/        (candidate, interview, question, response, evaluation)
├── models/     (SQLAlchemy ORM — one per entity)
├── schemas/    (Pydantic request/response schemas)
├── LLM/        (question.py, evaluation.py — Gemini-specific logic)
├── database.py
└── main.py
```

Responsibilities are layered: **API layer → Database/ORM layer → LLM layer.** The API handles HTTP requests and database operations, while the LLM layer handles Gemini-specific functionality.

---

## Testing

The API has been tested using:

- FastAPI Swagger/OpenAPI
- PostgreSQL / pgAdmin
- Real API requests, including valid and invalid resource IDs

Examples of testing performed:

- Successful CRUD operations
- 404 handling for missing resources
- 405 HTTP method debugging
- FastAPI response validation debugging
- SQLAlchemy relationship/mapping debugging
- Transaction and rollback handling
- LLM question generation and answer evaluation
- Verification of generated evaluation records in PostgreSQL

---

## Running the Project Locally

### 1. Clone the repository

```bash
git clone https://github.com/Hisham-05/AI-Powered-Interview-Evaluator
cd AI-Powered-Interview-Evaluator
```

### 2. Create and activate a virtual environment

Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file with your database connection and Gemini API key. Keep credentials in environment configuration rather than hardcoding them into source code.

```text
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>
GOOGLE_API_KEY=<your-gemini-api-key>
```

### 5. Start the FastAPI server

```bash
uvicorn app.main:app --reload
```

- API: `http://127.0.0.1:8000`
- Swagger docs: `http://127.0.0.1:8000/docs`

---

## Development Approach

This project is being developed using: **Learn → Understand why → Implement → Run → Test → Debug → Explain → Improve.**

Errors encountered during development have been treated as part of the learning and debugging process, including FastAPI response validation errors, incorrect request/schema fields, 404 vs 405 behavior, SQLAlchemy mapper configuration errors, database transaction failures, relationship configuration problems, and LLM structured-output handling.

---

## Project Roadmap

### Completed

- [x] Architecture, PostgreSQL setup, SQLAlchemy ORM foundation
- [x] Database sessions, transactions, foreign keys, relationships
- [x] FastAPI application with Pydantic schemas
- [x] Candidate / Interview / Question / Response / Evaluation CRUD
- [x] Gemini integration for question generation and response evaluation
- [x] Structured LLM output with Pydantic; persistence of evaluation results
- [x] Swagger/API testing and PostgreSQL verification

### In Progress / Planned

- [ ] Interview attempt/session management
- [ ] Interview-level scoring and complete evaluation workflow
- [ ] Report generation
- [ ] Audio-based interview input + speech-to-text integration
- [ ] Frontend
- [ ] Authentication
- [ ] Production security improvements (see below)
- [ ] Database cascade/delete behavior decisions
- [ ] Production deployment
- [ ] Optional advanced AI/RAG functionality

---

## Known Future Improvements

The current implementation is intentionally focused on building the core system first. Known areas for later improvement include:

- Password hashing before authentication/production use
- Dependency-injected database sessions
- Consistent session cleanup for all endpoints
- Intentional foreign-key delete behavior/cascades
- Preventing duplicate evaluations for the same response
- More robust error handling around LLM/API failures
- Production configuration and deployment hardening

These are part of the planned productionization stage rather than blockers for the current development milestone.

---

## Current Milestone

The project has moved beyond a basic CRUD backend. The core AI question-generation and response-evaluation pipelines are now functional.

The next major development focus is **report generation**, followed by the **audio-input version and frontend/product layer**.

---

## License

This project is currently a personal learning and development project.