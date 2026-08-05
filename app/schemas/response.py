from pydantic import BaseModel
from typing import Optional

class CreateResponse(BaseModel):
    question_id: int
    answer: Optional[str] = None

class ResponseResponse(BaseModel):
    id: int
    question_id: int
    answer: Optional[str] = None