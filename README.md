# AI-Powered Interview Evaluator

An end-to-end AI-powered mock technical interview application. A candidate can create an account, choose a role and company, receive AI-generated technical questions, answer them by typing or speaking, and receive an AI-based evaluation and interview score at the end.

The project started as a FastAPI and PostgreSQL backend and gradually grew into a full-stack application with AI question generation, AI answer evaluation, speech-to-text, a React frontend, authentication, and cloud deployment.

## What it does

```text
Candidate
   |
   v
Signup / Login
   |
   v
Choose role + company
   |
   v
Create Interview
   |
   v
Gemini generates 5 questions
   |
   v
Answer each question
   |--------------------|
   |                    |
 Type answer       Record answer
                        |
                    Deepgram
                        |
                        v
                   Transcript
                        |
   |--------------------|
   |
   v
Response
   |
   v
Gemini Evaluation
   |
   v
Interview Score
   |
   v
Results
```

A candidate can also skip a question. Skipped questions are stored as responses without an answer and are not sent for AI evaluation.

## Features

### Candidate accounts and authentication

- Candidate signup
- Candidate login
- Password hashing with Argon2 using `pwdlib`
- Candidate-specific interview flow
- Lightweight frontend authentication flow

### Interview generation

Each time a candidate starts an interview, a new `Interview` record is created.

The interview stores:

- Candidate
- Company
- Role
- Status

Gemini generates exactly 5 technical questions for the interview.

### Answering questions

Candidates can:

- Type an answer
- Record an answer using the browser microphone
- Skip a question

The frontend uses the browser Speech Synthesis API to read questions aloud.

Recorded answers are sent to Deepgram for speech-to-text transcription. The transcript is then stored as the candidate response.

### AI evaluation

Gemini evaluates submitted answers on:

- Accuracy
- Relevance
- Technical quality
- Grammar
- Confidence
- Filler-word count

The evaluation also provides feedback and strengths.

The scoring weights are:

| Category | Weight |
|---|---:|
| Accuracy | 30% |
| Relevance | 30% |
| Technical | 20% |
| Confidence | 10% |
| Grammar | 10% |

The final interview score is calculated across the interview's questions. Skipped questions contribute zero to the final score.

## Tech Stack

### Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic
- Gemini API
- Deepgram
- `pwdlib` with Argon2
- Gunicorn
- Uvicorn

### Frontend

- React
- Vite
- React Router
- Axios
- Tailwind CSS
- Browser Speech Synthesis API
- Browser MediaRecorder API

### Database

- PostgreSQL
- Neon

### Cloud / Infrastructure

- Amazon EC2
- Amazon S3
- Amazon CloudFront
- Nginx
- Let's Encrypt / Certbot
- AWS IAM
- systemd

## Project Structure

```text
AI-Powered-Interview-Evaluator/
|
├── app/
│   ├── LLM/
│   │   ├── evaluation.py
│   │   └── question.py
│   │
│   ├── api/
│   │   ├── candidate.py
│   │   ├── evaluation.py
│   │   ├── interview.py
│   │   ├── question.py
│   │   └── response.py
│   │
│   ├── models/
│   │   ├── candidate.py
│   │   ├── evaluation.py
│   │   ├── interview.py
│   │   ├── interview_result.py
│   │   ├── question.py
│   │   └── response.py
│   │
│   ├── schemas/
│   │   ├── candidate.py
│   │   ├── evaluation.py
│   │   ├── interview.py
│   │   ├── interview_result.py
│   │   ├── question.py
│   │   └── response.py
│   │
│   ├── services/
│   │   ├── auth.py
│   │   └── scoring.py
│   │
│   ├── database.py
│   └── main.py
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── requirements.txt
└── README.md
```

## Database Design

```text
Candidate
   |
   | 1-to-many
   v
Interview
   |
   | 1-to-many
   v
Question
   |
   | 1-to-many
   v
Response
   |
   | 1-to-1
   v
Evaluation

Interview
   |
   | 1-to-1
   v
InterviewResult
```

An `Interview` represents one complete attempt.

If the same candidate starts another interview, a new `Interview` record is created. This keeps questions, responses, evaluations, and the final score tied to that specific attempt.

## API Endpoints

### Candidates

```text
POST   /candidates
GET    /candidates
GET    /candidates/{id}
PUT    /candidates/{id}
DELETE /candidates/{id}
```

### Authentication

```text
POST /candidates/login
```

### Interviews

```text
POST   /interviews
GET    /interviews
GET    /interviews/{id}
PUT    /interviews/{id}
DELETE /interviews/{id}
```

### Question Generation

```text
POST /interviews/{id}/generate-questions
```

### Questions

```text
POST   /questions
GET    /questions
GET    /questions/{id}
PUT    /questions/{id}
DELETE /questions/{id}
```

### Responses

```text
POST   /responses
GET    /responses
GET    /responses/{id}
DELETE /responses/{id}
```

### Evaluation

The evaluation endpoint receives a response ID, retrieves the associated question and answer, sends the relevant information to Gemini, validates the structured result, and stores the evaluation.

## Running the Backend Locally

### 1. Clone the repository

```bash
git clone https://github.com/Hisham-05/AI-Powered-Interview-Evaluator.git
cd AI-Powered-Interview-Evaluator
```

### 2. Create a virtual environment

Windows:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

Linux / macOS:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file:

```text
DATABASE_URL=postgresql://username:password@localhost:5432/interview_evaluator
GOOGLE_API_KEY=your_google_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
```

Never commit `.env` files or API keys to GitHub.

### 5. Start the backend

```bash
uvicorn app.main:app --reload
```

The API will normally be available at:

```text
http://localhost:8000
```

Swagger documentation:

```text
http://localhost:8000/docs
```

## Running the Frontend Locally

Open a second terminal:

```bash
cd frontend
npm install
```

For local development, configure:

```text
VITE_API_BASE_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

## Production Architecture

The application is deployed as a full-stack cloud application using AWS for hosting and Neon PostgreSQL for the production database.

```text
                    Users
                      |
                      v
             CloudFront (HTTPS)
                      |
                      v
              S3 Static Frontend
                      |
                API requests
                      |
                      v
              Nginx on EC2
                      |
                      v
       Gunicorn + Uvicorn Workers
                      |
          +-----------+-----------+
          |                       |
          v                       v
   Neon PostgreSQL          Gemini / Deepgram
```

### Frontend

The React frontend is built with Vite and deployed using:

- Amazon S3
- Amazon CloudFront
- CloudFront Origin Access Control (OAC)

The S3 bucket is private. CloudFront serves the frontend without making the bucket publicly accessible.

### Backend

The FastAPI backend runs on Amazon EC2 using:

- Gunicorn
- Uvicorn workers
- Nginx
- systemd
- Let's Encrypt / Certbot

Nginx receives public HTTPS traffic and forwards requests to FastAPI running privately on:

```text
127.0.0.1:8000
```

Port `8000` is not exposed publicly.

systemd keeps the backend service running and restarts it if the process stops.

### Database

The production application uses Neon PostgreSQL.

The backend connects to Neon using SQLAlchemy and `psycopg2`.

### AI Services

The application uses:

- Google Gemini for question generation and answer evaluation
- Deepgram for speech-to-text transcription

API keys are stored as backend environment variables and are not included in the frontend build.

## Production Environment Variables

### Backend

```text
GOOGLE_API_KEY=
DEEPGRAM_API_KEY=
DATABASE_URL=
```

These values are stored on the backend server and are not committed to the repository.

### Frontend

```text
VITE_API_BASE_URL=
```

The production frontend is built with the backend API URL supplied through the Vite production environment.

The frontend does not contain Gemini, Deepgram, or database credentials.

## Production Deployment Flow

Frontend:

```text
React source
     |
     v
npm run build
     |
     v
Vite production build
     |
     v
Amazon S3
     |
     v
CloudFront
     |
     v
User's browser
```

Backend:

```text
FastAPI application
     |
     v
EC2
     |
     v
Gunicorn
     |
     v
Uvicorn workers
     |
     v
Nginx
     |
     v
HTTPS
```

Backend integrations:

```text
FastAPI
   |
   +-----> Neon PostgreSQL
   |
   +-----> Gemini
   |
   +-----> Deepgram
```

## HTTPS and Certificate Renewal

The backend is served through HTTPS using a Let's Encrypt certificate.

Certbot is configured with a systemd timer to periodically check for certificate renewal.

After renewal, Nginx is reloaded so that the renewed certificate is used.

## Security

The current deployment includes:

- HTTPS for public backend traffic
- Private S3 bucket
- CloudFront Origin Access Control
- Port `8000` kept private
- SSH restricted to the administrator's IP
- API keys stored in environment variables
- `.env` files excluded from Git
- AWS IAM permissions scoped to the required deployment resources

Future security improvements include stronger authentication and authorization, rate limiting, secret management, and additional API hardening.

## Testing

### Backend testing

Swagger / OpenAPI was used to test:

- Candidate operations
- Login
- Interview creation
- Question generation
- Response submission
- AI evaluation
- Invalid resource IDs
- Skipped questions
- Error handling

### Database verification

PostgreSQL data was inspected during development to verify that API operations created and modified the expected records.

### Production end-to-end testing

The deployed application was tested through the production frontend.

The complete flow was tested:

```text
Signup
  |
  v
Login
  |
  v
Create Interview
  |
  v
Generate Questions
  |
  v
Answer Questions
  |
  +----> Type Answer
  |
  +----> Record Audio
  |          |
  |       Deepgram
  |          |
  |       Transcript
  |
  +----> Skip Question
  |
  v
Submit Response
  |
  v
AI Evaluation
  |
  v
Results
```

Audio handling was also tested with unsuccessful audio submissions followed by a successful recording, confirming that the application could recover from failed transcription attempts.

## Development Lessons

### SQLAlchemy relationships

While developing the ORM relationships, mapper configuration issues highlighted the importance of correct model imports and relationship configuration.

### FastAPI response validation

Response validation was debugged by comparing:

```text
Database object
      |
      v
Endpoint return value
      |
      v
Pydantic response model
```

This helped ensure that list endpoints return list-compatible schemas while single-resource endpoints return the correct object schema.

### Database transactions

Database operations use explicit commit, refresh, rollback, and session cleanup where appropriate.

A failed transaction must be rolled back before the session can safely continue.

### Production database connectivity

A stale PostgreSQL connection was encountered during deployment. Restarting the application restored connectivity.

This highlighted the importance of reliable database connection management when using a managed PostgreSQL service.

### AWS IAM

The EC2 instance uses an IAM role rather than storing long-lived AWS access keys on the server.

The role provides the permissions required for frontend deployment operations such as S3 uploads and CloudFront invalidation.

## Project Status

The application has been implemented, deployed, and tested through the complete production interview flow.

### Completed

- Candidate signup
- Candidate login
- Password hashing with Argon2
- Interview creation
- Gemini question generation
- Five-question interview flow
- Typed answers
- Recorded answers
- Speech-to-text transcription
- Skip-question handling
- Gemini answer evaluation
- Structured AI evaluation
- Interview scoring
- Results page
- React frontend
- Neon PostgreSQL production database
- AWS S3 frontend hosting
- CloudFront distribution
- EC2 backend hosting
- Nginx reverse proxy
- Gunicorn + Uvicorn workers
- HTTPS with Let's Encrypt
- Automatic certificate renewal
- Production end-to-end testing
- Git/GitHub version control

### Future Improvements

- Stronger authentication and authorization
- Server-side session/token management
- Database migrations with Alembic
- More comprehensive error handling
- LLM retry and timeout strategies
- Rate limiting
- Production monitoring and logging
- Stronger API validation
- More robust result presentation
- Additional security hardening
- Optional RAG-based interview customization

## Why I Built This

The project is mainly a practical way to learn how the pieces of a full-stack AI application fit together.

Instead of treating the LLM as the whole application, the project puts it inside a normal backend architecture with a relational database, API layer, validation, audio processing, frontend, cloud infrastructure, and external AI services.

The interesting problems are therefore not only about calling an LLM.

They also include:

- Designing relational data models
- Keeping separate interview attempts independent
- Connecting questions to responses
- Handling skipped questions
- Processing audio input
- Handling failed transcription
- Validating structured LLM output
- Persisting AI evaluations
- Calculating interview scores
- Connecting React to FastAPI
- Deploying services to AWS
- Configuring HTTPS and reverse proxies
- Managing environment variables
- Configuring IAM permissions

The project represents an attempt to understand the complete lifecycle of an AI-powered application rather than only the AI API call.
