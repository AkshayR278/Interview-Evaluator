from fastapi import FastAPI
from app.api import candidate
from app.api import interview
from app.api import question
from app.api import response
from app.api import evaluation
from app.database import Base, engine
from app.models.candidate import Candidate
from app.models.interview import Interview
from app.models.question import Question
from app.models.response import Response
from app.models.evaluation import Evaluation
from app.models.interview_result import InterviewResult
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(evaluation.router)
app.include_router(candidate.router)
app.include_router(interview.router)
app.include_router(question.router)
app.include_router(response.router)

Base.metadata.create_all(engine)

@app.get("/")
def home():
    return {"message": "Welcome to AI Interview Evaluator"}