from typing import List, Literal, Optional
from pydantic import BaseModel, field_validator
from app.models.evaluation import EvaluationRecord

ProjectCategory = Literal[
    "saas", "marketplace", "developer-tool", "fintech", "health",
    "education", "e-commerce", "ai-ml", "mobile-app", "other"
]
ProjectStatus = Literal["idea", "prototype", "launched", "scalable"]
ReviewStatus = Literal["draft", "pending_review", "published", "rejected"]
EvaluationStatus = Literal["not_requested", "pending", "complete", "failed"]
MonthlyRevenue = Literal["pre-revenue", "<1k", "1k-5k", "5k-20k", "20k-50k", "50k+"]
MonthlyUsers = Literal["<100", "100-1k", "1k-10k", "10k-50k", "50k+"]


class Project(BaseModel):
    projectId: str
    userId: str
    name: str
    tagline: str
    description: str
    vision: str
    features: List[str]
    slug: str
    websiteUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    githubStars: Optional[int] = None
    githubLastUpdated: Optional[str] = None
    contactEmail: str
    contactNote: Optional[str] = None
    monthlyRevenue: Optional[MonthlyRevenue] = None
    monthlyUsers: Optional[MonthlyUsers] = None
    category: ProjectCategory
    status: ProjectStatus
    likeCount: int = 0
    likedByMe: Optional[bool] = None
    reviewStatus: ReviewStatus = "pending_review"
    rejectionReason: Optional[str] = None
    evaluationStatus: EvaluationStatus = "not_requested"
    evaluation: Optional[EvaluationRecord] = None
    evaluationLockedUntil: Optional[str] = None
    createdAt: str
    updatedAt: str


def _require_https(v: Optional[str]) -> Optional[str]:
    if v and not v.startswith("https://"):
        raise ValueError("URL must use https://")
    return v


class CreateProjectInput(BaseModel):
    name: str
    tagline: str
    description: str
    vision: str
    features: List[str]
    websiteUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    screenshotUrl: Optional[str] = None
    contactEmail: str
    contactNote: Optional[str] = None
    monthlyRevenue: Optional[MonthlyRevenue] = None
    monthlyUsers: Optional[MonthlyUsers] = None
    category: ProjectCategory
    status: ProjectStatus

    @field_validator("websiteUrl", "githubUrl", "screenshotUrl", mode="before")
    @classmethod
    def validate_urls(cls, v: Optional[str]) -> Optional[str]:
        return _require_https(v)


class UpdateProjectInput(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    vision: Optional[str] = None
    features: Optional[List[str]] = None
    websiteUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    screenshotUrl: Optional[str] = None
    contactEmail: Optional[str] = None
    contactNote: Optional[str] = None
    monthlyRevenue: Optional[MonthlyRevenue] = None
    monthlyUsers: Optional[MonthlyUsers] = None
    category: Optional[ProjectCategory] = None
    status: Optional[ProjectStatus] = None

    @field_validator("websiteUrl", "githubUrl", "screenshotUrl", mode="before")
    @classmethod
    def validate_urls(cls, v: Optional[str]) -> Optional[str]:
        return _require_https(v)
