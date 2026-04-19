from typing import Literal, Optional
from pydantic import BaseModel

UserRole = Literal["member", "admin"]


class User(BaseModel):
    userId: str
    email: str
    name: str
    avatarUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    twitterUrl: Optional[str] = None
    hasProject: bool = False
    role: UserRole = "member"
    createdAt: str
    updatedAt: str


class PublicUser(BaseModel):
    userId: str
    name: str
    avatarUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    twitterUrl: Optional[str] = None
    hasProject: bool


class UpdateUserInput(BaseModel):
    name: Optional[str] = None
    avatarUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    twitterUrl: Optional[str] = None
