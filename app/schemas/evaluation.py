from pydantic import BaseModel, Field

class CreateEvaluation(BaseModel):
    response_id: int
    accuracy_score: int = Field(ge=0, le=100)
    relevance_score: int = Field(ge=0, le=100)
    technical_score: int = Field(ge=0, le=100)
    grammar_score: int = Field(ge=0, le=100)
    confidence_score: int = Field(ge=0, le=100)
    filler_word_count: int
    feedback: str
    strengths: str

class EvaluationResponse(BaseModel):
    id: int
    response_id: int
    accuracy_score: int
    relevance_score: int
    technical_score: int
    grammar_score: int
    confidence_score: int
    filler_word_count: int
    feedback: str
    strengths: str

class GeneratedEvaluation(BaseModel):
    accuracy_score: int
    relevance_score: int
    technical_score: int
    grammar_score: int
    confidence_score: int
    filler_word_count: int
    feedback: str
    strengths: str