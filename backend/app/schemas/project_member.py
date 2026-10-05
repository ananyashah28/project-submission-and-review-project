"""
Pydantic schemas for Project Member management (Zoho Projects & Jira style)
"""
from datetime import datetime
from uuid import UUID
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict, EmailStr


class ProjectMemberBase(BaseModel):
    role: Optional[str] = Field("member", description="Role in project: admin, member, or viewer")


class ProjectMemberCreate(BaseModel):
    email: Optional[EmailStr] = Field(None, description="Email of the user to add")
    user_id: Optional[UUID] = Field(None, description="ID of the user to add")
    role: Optional[str] = Field("member", description="Role: admin, member, or viewer")


class ProjectMemberUpdate(BaseModel):
    role: str = Field(..., description="Updated role: admin, member, or viewer")


class ProjectMemberResponse(BaseModel):
    id: UUID
    project_id: UUID
    user_id: UUID
    name: str
    email: str
    role: str
    joined_at: datetime
    is_owner: bool = False

    model_config = ConfigDict(from_attributes=True)


class ProjectMemberListResponse(BaseModel):
    total: int
    members: List[ProjectMemberResponse]
