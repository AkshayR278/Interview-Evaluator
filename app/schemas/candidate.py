from pydantic import BaseModel

class CreateCandidate(BaseModel):
    name: str
    email: str
    password: str

class CandidateResponse(BaseModel):
    id: int
    name: str
    email: str

class CandidateUpdate(BaseModel):
    name: str
    email: str

