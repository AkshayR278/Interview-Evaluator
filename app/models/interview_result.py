from app.database import Base
from sqlalchemy.orm import relationship
from sqlalchemy import Integer, DateTime, Column, ForeignKey
from datetime import datetime

class InterviewResult(Base):
    __tablename__ = "interview_result"

    id = Column(Integer, primary_key=True)

    interview_id = Column(Integer, ForeignKey("interviews.id"),unique=True)

    total_score = Column(Integer)

    time_created = Column(DateTime, default=datetime.now)

    interview_att = relationship("Interview", back_populates="interview_result_att", uselist=False)