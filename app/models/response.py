from sqlalchemy.orm import relationship

from app.database import Base
from sqlalchemy import Column, Integer, String, ForeignKey

class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True)

    question_id = Column(Integer, ForeignKey("questions.id"), unique=True)

    answer = Column(String)

    question = relationship("Question", back_populates="response")

    evaluation = relationship("Evaluation", back_populates= "response", uselist=False)