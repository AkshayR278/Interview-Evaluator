# AI-Powered Interview Evaluator

An end-to-end mock technical interview application. A candidate logs in,
chooses a role and company, gets a set of technical questions generated
by Gemini, answers them by typing or speaking, and receives an
evaluation at the end.

This project started as a FastAPI and PostgreSQL backend and gradually
grew into a small full-stack application. The main focus has been on
getting the data model and interview flow right before adding more
features.

## What it does

The current flow looks like this:

``` text
Candidate
   |
   v
Login
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
   |                    |
   |                Deepgram
   |                    |
   |-------> Response <-|
              |
              v
        Gemini evaluation
              |
              v
        Interview score
              |
              v
           Results
```

A candidate can also skip a question. A skipped question is stored as a
response with no answer, is not sent to Gemini for evaluation, and
contributes zero to the final score.

## Features

### Candidate accounts

-   Candidate creation endpoint
-   Passwords are hashed with Argon2 using `pwdlib`
-   Login endpoint verifies the password against the stored hash
-   The returned candidate ID is stored in the browser's local storage
    for the current frontend flow

### Interview generation

Each time a candidate starts an interview, a new `Interview` record is
created.

The interview stores:

-   Candidate
-   Company
-   Role
-   Status

Gemini then generates exactly 5 technical questions for that interview.

### Answering questions

There are two ways to answer:

-   Type an answer
-   Record an answer using the browser microphone

Questions can also be skipped.

The frontend uses the browser's Speech Synthesis API to read questions
aloud.

For recorded answers, the audio is sent to Deepgram and the resulting
transcript is stored as the candidate's response.

### AI evaluation

Gemini evaluates submitted answers on:

-   Accuracy
-   Relevance
-   Technical quality
-   Grammar
-   Confidence
-   Filler-word count

The evaluation also contains feedback and strengths.

The scoring weights are:

  Category       Weight
  ------------ --------
  Accuracy          30%
  Relevance         30%
  Technical         20%
  Confidence        10%
  Grammar           10%

Accuracy and relevance therefore have the biggest effect on the score.

The final interview score is calculated over all questions. Since
skipped questions have no evaluation, they contribute zero through the
total-question denominator.

## Tech stack

### Backend

-   Python
-   FastAPI
-   SQLAlchemy
-   PostgreSQL
-   Pydantic
-   Gemini API through the OpenAI-compatible client
-   Deepgram
-   `pwdlib` with Argon2

### Frontend

-   React
-   Vite
-   React Router
-   Axios
-   Tailwind CSS

### Development tools

-   Swagger / OpenAPI
-   pgAdmin
-   Git / GitHub

## Project structure

``` text
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

## Database design

The main relationships are:

``` text
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
   | 1-to-1
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

The important part of the design is that an `Interview` represents one
complete attempt.

If the same candidate starts another interview for the same role, a new
`Interview` is created. This keeps the questions, responses,
evaluations, and final score tied to that specific attempt.

`question_id` is unique in `responses`, so a question can have at most
one response. `response_id` is unique in `evaluations`, so a response
can have at most one evaluation. `interview_id` is unique in
`interview_result`, so an interview can have one final result.

## Running the backend

### 1. Clone the repository

``` bash
git clone https://github.com/Hisham-05/AI-Powered-Interview-Evaluator.git
cd AI-Powered-Interview-Evaluator
```

### 2. Create a virtual environment

Windows:

``` powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

Linux / macOS:

``` bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install the Python dependencies

``` bash
pip install -r requirements.txt
```

The backend currently imports a few packages that should also be present
in the environment:

``` bash
pip install openai deepgram-sdk "pwdlib[argon2]"
```

If you are setting up the project from scratch, make sure these
dependencies are included in `requirements.txt` as well.

### 4. Create the PostgreSQL database

Create a PostgreSQL database and set the connection string in `.env`.

Example:

``` text
DATABASE_URL=postgresql://username:password@localhost:5432/interview_evaluator
```

### 5. Add API keys

The backend reads these values from the environment:

``` text
DATABASE_URL=postgresql://username:password@localhost:5432/interview_evaluator
GOOGLE_API_KEY=your_gemini_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
```

Do not commit the `.env` file.

### 6. Start FastAPI

``` bash
uvicorn app.main:app --reload
```

The API will be available at:

``` text
http://localhost:8000
```

Swagger documentation:

``` text
http://localhost:8000/docs
```

## Running the frontend

Open another terminal and go into the frontend directory:

``` bash
cd frontend
```

Install the JavaScript dependencies:

``` bash
npm install
```

Start Vite:

``` bash
npm run dev
```

The frontend runs on:

``` text
http://localhost:5173
```

The frontend uses `VITE_API_BASE_URL` if it is set. Otherwise it
defaults to:

``` text
http://localhost:8000
```

## Current API flow

Some of the main endpoints are:

``` text
POST   /candidates
POST   /candidates/login

POST   /interviews
GET    /interviews/{id}
POST   /interviews/{id}/generate-questions
POST   /interviews/{id}/complete

POST   /responses
POST   /responses/skipped
POST   /responses/transcribe

POST   /responses/{id}/generate-evaluation
POST   /interview/{id}/generate-evaluation

GET    /questions
GET    /responses
GET    /evaluations
```

The application normally uses the frontend to drive this flow rather
than calling every endpoint manually.

## A note about authentication

The current login implementation is intentionally simple.

After a successful login, the backend returns the candidate ID and the
frontend stores it in local storage:

``` text
candidate_id -> localStorage
```

The home page then uses that ID when creating an interview.

This is enough for the current development stage, but it is not a
complete production authentication system. There is no JWT or
server-side session yet, and the frontend currently relies on the stored
candidate ID.

## Development notes

A lot of the project has been built by testing each part separately
before moving to the next one.

The database relationships were designed around the interview attempt
rather than around a candidate's entire history. This makes it possible
to trace a result back through:

``` text
InterviewResult
    -> Interview
    -> Question
    -> Response
    -> Evaluation
```

The scoring logic also keeps skipped questions separate from evaluated
answers. A skipped question still has a `Response` row so the interview
can be completed, but it does not get sent to Gemini.

For audio answers, the browser records a WebM file, FastAPI sends it to
Deepgram, and the transcript becomes the stored response.

## Project status

The core interview flow is working and the project is still under
development.

Current pieces include:

-   Candidate accounts and password hashing
-   Candidate login
-   Interview creation
-   Gemini question generation
-   Five-question interview flow
-   Typed answers
-   Recorded answers
-   Deepgram transcription
-   Skip-question handling
-   Gemini answer evaluation
-   Weighted interview scoring
-   Results page

There are still areas that can be improved, especially around production
authentication, authorization, error handling, database migrations, and
making the results flow more robust.

## Why I built this

The project is mainly a practical way to learn how the pieces of a
full-stack AI application fit together.

Instead of treating the LLM as the whole application, the project puts
it inside a normal backend architecture with a relational database, API
layer, validation, audio processing, and a frontend.

That means the interesting problems are not only about calling an LLM.
They are also about deciding how the data should be related, what should
happen when a candidate skips a question, how to handle failed
transcription, and how to keep one interview attempt separate from
another.
