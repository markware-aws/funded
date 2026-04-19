from typing import Literal
from pydantic import BaseModel


class EvaluationDimension(BaseModel):
    score: int
    reasoning: str


class EvaluationScores(BaseModel):
    problemClarity: EvaluationDimension
    originality: EvaluationDimension
    completenessDeployment: EvaluationDimension
    commercialViability: EvaluationDimension
    presentationQuality: EvaluationDimension


ReadinessLabel = Literal["idea", "prototype", "launched", "scalable"]


class EvaluationResult(BaseModel):
    """Structured output returned by PydanticAI — stored as-is in DynamoDB."""
    scores: EvaluationScores
    totalScore: int
    summary: str
    strongestSignal: str
    biggestGap: str
    readinessLabel: ReadinessLabel


class EvaluationRecord(EvaluationResult):
    """EvaluationResult with timestamps, embedded in the Project item."""
    requestedAt: str
    completedAt: str
