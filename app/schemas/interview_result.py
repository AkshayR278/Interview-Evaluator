from datetime import datetime
from pydantic import BaseModel

class InterviewResultResponse(BaseModel):
    id: int
    interview_id: int
    total_score: int
    time_created: datetime