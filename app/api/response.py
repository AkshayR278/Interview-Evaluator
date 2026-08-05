from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from app.database import sessionLocal
from app.models.question import Question
from app.models.response import Response
from app.schemas.response import CreateResponse, ResponseResponse

router = APIRouter()

@router.post("/responses", response_model=ResponseResponse)
def create_response(response : CreateResponse):
    session = sessionLocal()
    try:
        statement = select(Question).where(Question.id == response.question_id)
        result = session.execute(statement)
        question = result.scalar_one_or_none()

        if question is None:
            raise HTTPException(status_code=404, detail="Question not found")

        response_db = Response(question_id= response.question_id, answer= response.answer)
        session.add(response_db)
        session.commit()
        session.refresh(response_db)

        return response_db

    finally:
        session.close()

@router.get("/responses", response_model=list[ResponseResponse])
def get_responses():
    session = sessionLocal()
    statement = select(Response)
    result = session.execute(statement)
    responses = result.scalars().all()
    session.close()
    return responses

@router.get("/responses/{id}", response_model=ResponseResponse)
def get_response(id: int):
    session = sessionLocal()
    try:
        statement = select(Response).where(Response.id == id)
        result = session.execute(statement)
        response = result.scalar_one_or_none()

        if response is None:
            raise HTTPException(status_code=404, detail="Response not found")

        return response

    finally:
        session.close()

@router.delete("/responses/{id}")
def delete_response(id:int):
    session = sessionLocal()
    try:
        statement = select(Response).where(Response.id == id)
        result = session.execute(statement)
        response = result.scalar_one_or_none()

        if response is None:
            raise HTTPException(status_code=404, detail="Response not found")

        session.delete(response)
        session.commit()

        return "Response Deleted successfully"

    finally:
        session.close()