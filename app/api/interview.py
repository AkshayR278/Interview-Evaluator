from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.database import sessionLocal
from app.models.interview import Interview
from app.models.candidate import Candidate
from app.schemas.interview import CreateInterview, InterviewResponse, UpdateInterview

router = APIRouter()

@router.post("/interviews", response_model = InterviewResponse)
def create_interview(interview: CreateInterview):
    session = sessionLocal()
    try:
        statement = select(Candidate).where(Candidate.id == interview.candidate_id)
        result = session.execute(statement)
        candidate = result.scalar_one_or_none()

        if candidate is None:
            raise HTTPException(status_code = 404, detail = "Candidate not found")

        db_interview = Interview(candidate_id = interview.candidate_id, company = interview.company, role = interview.role)
        session.add(db_interview)
        session.commit()
        session.refresh(db_interview)

        return db_interview

    finally:
        session.close()

@router.get("/interviews", response_model = list[InterviewResponse])
def get_interviews():
    session = sessionLocal()
    statement = select(Interview)
    result = session.execute(statement)
    interviews = result.scalars().all()
    session.close()
    return interviews

@router.get("/interviews/{id}", response_model = InterviewResponse)
def get_interview(id : int):
    session = sessionLocal()
    try:
        statement = select(Interview).where(Interview.id == id)
        result = session.execute(statement)
        interview = result.scalar_one_or_none()

        if interview is None:
            raise HTTPException(status_code = 404, detail = "Interview not found")

        return interview
    finally:
        session.close()

@router.put("/interviews/{id}", response_model=InterviewResponse)
def update_interview(id : int, updated_content : UpdateInterview):
    session = sessionLocal()
    try:
        statement = select(Interview).where(Interview.id == id)
        result = session.execute(statement)
        interview = result.scalar_one_or_none()

        if interview is None:
            raise HTTPException(status_code = 404, detail = "Interview not found")

        statement = select(Candidate).where(Candidate.id == updated_content.candidate_id)
        result = session.execute(statement)
        candidate = result.scalar_one_or_none()

        if candidate is None:
            raise HTTPException(status_code = 404, detail = "Candidate not found")

        interview.candidate_id = updated_content.candidate_id
        interview.company = updated_content.company
        interview.role = updated_content.role

        session.commit()
        session.refresh(interview)

        return interview

    finally:
        session.close()

@router.delete("/interviews/{id}")
def delete_interview(id:int):
    session = sessionLocal()
    try:
        statement = select(Interview).where(Interview.id == id)
        result = session.execute(statement)
        interview = result.scalar_one_or_none()

        if interview is None:
            raise HTTPException(status_code=404, detail="Interview not found")

        session.delete(interview)
        session.commit()
        return "Interview deleted successfully"

    finally:
        session.close()