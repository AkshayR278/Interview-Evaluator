from app.database import Base
from sqlalchemy import Column, String, Integer, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True)

    response_id = Column(Integer, ForeignKey("responses.id"), unique=True)

    accuracy_score = Column(Integer, CheckConstraint("accuracy_score BETWEEN 0 AND 100"))

    relevance_score = Column(Integer, CheckConstraint("relevance_score BETWEEN 0 AND 100"))

    technical_score = Column(Integer, CheckConstraint("technical_score BETWEEN 0 AND 100"))

    grammar_score = Column(Integer, CheckConstraint("grammar_score BETWEEN 0 AND 100"))

    confidence_score = Column(Integer, CheckConstraint("confidence_score BETWEEN 0 AND 100"))

    filler_word_count = Column(Integer)

    feedback = Column(String)

    strengths = Column(String)

    response = relationship("Response", back_populates="evaluation")