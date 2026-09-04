from fastapi import APIRouter, HTTPException, UploadFile, File
from sqlalchemy import select
from app.database import sessionLocal
from app.models.question import Question
from app.models.response import Response
from app.schemas.response import CreateResponse, ResponseResponse
import os
from dotenv import load_dotenv
from deepgram import AsyncDeepgramClient
load_dotenv()

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
deepgram_client = AsyncDeepgramClient(api_key=DEEPGRAM_API_KEY)


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

@router.post("/responses/transcribe", response_model=ResponseResponse)
async def transcribe_audio(question_id: int, audio_file: UploadFile = File(...)):
    session = sessionLocal()
    try:
        statement = select(Question).where(Question.id == question_id)
        result = session.execute(statement)
        question = result.scalar_one_or_none()

        if question is None:
            raise HTTPException(status_code=404, detail="Question not found")

        statement = select(Response).where(Response.question_id == question_id)
        result = session.execute(statement)
        existing_response = result.scalar_one_or_none()

        if existing_response is not None:
            raise HTTPException(status_code=409, detail="This question has already been answered")

        audio_bytes = await audio_file.read()

        try:
            deepgram_response = await deepgram_client.listen.v1.media.transcribe_file(
                request=audio_bytes,
                model="nova-3",
                language="en"
            )
            transcript = deepgram_response.results.channels[0].alternatives[0].transcript
        except Exception:
            raise HTTPException(status_code=502, detail="Transcription service failed")

        response_db = Response(question_id=question_id, answer=transcript)
        session.add(response_db)
        session.commit()
        session.refresh(response_db)

        return response_db
    finally:
        session.close()