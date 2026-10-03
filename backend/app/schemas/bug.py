"""
Pydantic schemas for Bug / Issue Tracker operations
"""
from datetime import datetime
from uuid import UUID
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict

from app.models.bug import BugSeverity, BugStatus


class BugBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Bug title")
    description: Optional[str] = Field(None, max_length=5000, description="Bug description")
    reproduction_steps: Optional[str] = Field(None, max_length=5000, description="Steps to reproduce")
    severity: Optional[BugSeverity] = Field(default=BugSeverity.MEDIUM, description="Bug severity")
    status: Optional[BugStatus] = Field(default=BugStatus.OPEN, description="Bug status")
    reported_by: Optional[str] = Field(None, max_length=150, description="Reporter name")
    assigned_to: Optional[str] = Field(None, max_length=150, description="Assignee name")
    assignee_id: Optional[UUID] = Field(None, description="Assigned team member user ID")
    task_id: Optional[UUID] = Field(None, description="Optional associated task ID")


class BugCreate(BugBase):
    pass


class BugUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=5000)
    reproduction_steps: Optional[str] = Field(None, max_length=5000)
    severity: Optional[BugSeverity] = None
    status: Optional[BugStatus] = None
    reported_by: Optional[str] = Field(None, max_length=150)
    assigned_to: Optional[str] = Field(None, max_length=150)
    assignee_id: Optional[UUID] = None
    task_id: Optional[UUID] = None


class BugResponse(BaseModel):
    id: UUID
    project_id: UUID
    task_id: Optional[UUID] = None
    task_title: Optional[str] = None
    title: str
    description: Optional[str] = None
    reproduction_steps: Optional[str] = None
    severity: str
    status: str
    reported_by: Optional[str] = None
    assigned_to: Optional[str] = None
    assignee_id: Optional[UUID] = None
    assignee_name: Optional[str] = None
    assignee_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BugListResponse(BaseModel):
    total: int
    bugs: List[BugResponse]
