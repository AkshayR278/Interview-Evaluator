from fastapi import APIRouter, HTTPException
from app.schemas.candidate import CandidateResponse, CreateCandidate, CandidateUpdate
from app.models.candidate import Candidate
from app.database import sessionLocal
from sqlalchemy import select

router = APIRouter()
@router.post("/candidates", response_model=CandidateResponse)
def create_candidate(candidate: CreateCandidate):
    db_candidate = Candidate(name=candidate.name, email=candidate.email, password=candidate.password)
    session = sessionLocal()
    session.add(db_candidate)

    session.commit()
    session.refresh(db_candidate)

    session.close()

    return db_candidate

@router.get("/candidates", response_model=list[CandidateResponse])
def get_candidates():
    session = sessionLocal()
    statement = select(Candidate)
    result = session.execute(statement)
    candidates = result.scalars().all()

    session.close()

    return candidates

@router.get("/candidates/{id}", response_model=CandidateResponse)
def single_candidate_return(id: int):
    session = sessionLocal()
    try:
        statement = select(Candidate).where(Candidate.id == id)
        result = session.execute(statement)
        candidate = result.scalar_one_or_none()

        if candidate is None:
            raise HTTPException(
                status_code=404,
                detail="Candidate not found"
            )

        return candidate

    finally:
        session.close()

@router.put("/candidates/{id}", response_model= CandidateResponse)
def update_candidate(id:int, candidate_update: CandidateUpdate):
    session = sessionLocal()
    try:
        statement = select(Candidate).where(Candidate.id == id)
        result = session.execute(statement)
        candidate = result.scalar_one_or_none()

        if candidate is None:
            raise HTTPException(status_code= 404, detail= "Candidate not found")

        candidate.name = candidate_update.name
        candidate.email = candidate_update.email

        session.commit()
        session.refresh(candidate)

        return candidate

    finally:
        session.close()

@router.delete("/candidates/{id}")
def delete_candidate(id: int):
    session = sessionLocal()
    try:
        statement = select(Candidate).where(Candidate.id == id)
        result = session.execute(statement)
        candidate = result.scalar_one_or_none()

        if candidate is None:
            raise HTTPException(status_code = 404, detail = "Candidate not found")

        session.delete(candidate)
        session.commit()

        return "Deleted successfully!"

    finally:
        session.close()