from fastapi import HTTPException, APIRouter

from app.models.interview import Interview
from app.schemas.question import CreateQuestion, QuestionResponse, UpdateQuestion
from app.models.question import Question
from app.database import sessionLocal
from sqlalchemy import select, delete
from app.LLM.question import generate_questions

router = APIRouter()

@router.post("/questions", response_model=QuestionResponse)
def create_question(question:CreateQuestion):
    session = sessionLocal()
    try:
        statement = select(Interview).where(Interview.id == question.interview_id)
        result = session.execute(statement)
        interview = result.scalar_one_or_none()

        if interview is None:
            raise HTTPException(status_code=404, detail="Interview not found")

        db_question = Question(interview_id = question.interview_id, question = question.question)
        session.add(db_question)
        session.commit()
        session.refresh(db_question)

        return db_question

    finally:
        session.close()

@router.get("/questions", response_model=list[QuestionResponse])
def get_questions():
    session = sessionLocal()
    try:
        statement = select(Question)
        result = session.execute(statement)
        questions = result.scalars().all()

        return questions

    finally:
        session.close()

@router.get("/questions/{id}", response_model=QuestionResponse)
def get_single_question(id: int):
    session = sessionLocal()
    try:
        statement = select(Question).where(Question.id == id)
        result = session.execute(statement)
        question = result.scalar_one_or_none()

        if question is None:
            raise HTTPException(status_code=404, detail="Question not found")

        return question

    finally:
        session.close()

@router.put("/questions/{id}", response_model=QuestionResponse)
def update_question(id: int, question_content: UpdateQuestion):
    session = sessionLocal()
    try:
        statement = select(Question).where(Question.id == id)
        result = session.execute(statement)
        question = result.scalar_one_or_none()

        if question is None:
            raise HTTPException(status_code=404, detail="Question not found")

        statement = select(Interview).where(Interview.id == question_content.interview_id)
        result = session.execute(statement)
        interview = result.scalar_one_or_none()

        if interview is None:
            raise HTTPException(status_code=404, detail="Interview not found")

        question.interview_id = question_content.interview_id
        question.question = question_content.question

        session.commit()
        session.refresh(question)

        return question

    finally:
        session.close()

@router.delete("/questions/{id}")
def delete_question(id: int):
    session = sessionLocal()
    try:
        statement = select(Question).where(Question.id == id)
        result = session.execute(statement)
        question = result.scalar_one_or_none()

        if question is None:
            raise HTTPException(status_code=404, detail="Question not found")

        session.delete(question)
        session.commit()

        return "Question deleted successfully"

    finally:
        session.close()

@router.post("/interviews/{id}/generate-questions", response_model=list[QuestionResponse])
def llm_questions(id: int):
    session = sessionLocal()
    try:
        statement = select(Interview).where(Interview.id == id)
        result = session.execute(statement)
        interview = result.scalar_one_or_none()

        if interview is None:
            raise HTTPException(status_code=404, detail="Interview not found")

        new_questions = generate_questions(role=interview.role, company= interview.company)
        list_of_questions = [Question(interview_id=id, question=question) for question in new_questions]
        session.add_all(list_of_questions)
        session.commit()
        for question in list_of_questions:
            session.refresh(question)

        return list_of_questions

    except Exception:
        session.rollback()
        raise

    finally:
        session.close()
