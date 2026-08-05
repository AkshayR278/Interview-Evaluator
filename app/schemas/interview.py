from pydantic import BaseModel

class CreateInterview(BaseModel):
    candidate_id : int
    company : str
    role : str

class InterviewResponse(BaseModel):
    id : int
    candidate_id : int
    company : str
    role : str

class UpdateInterview(BaseModel):
    candidate_id : int
    company : str
    role : str