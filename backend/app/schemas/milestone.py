"""
Pydantic schemas for Milestone / Sprint operations
"""
from datetime import datetime
from uuid import UUID
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict

from app.models.milestone import MilestoneStatus


class MilestoneBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Milestone title")
    description: Optional[str] = Field(None, max_length=3000, description="Milestone description")
    status: Optional[MilestoneStatus] = Field(default=MilestoneStatus.ACTIVE, description="Status")
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class MilestoneCreate(MilestoneBase):
    pass


class MilestoneUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=3000)
    status: Optional[MilestoneStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class MilestoneResponse(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    description: Optional[str] = None
    status: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    tasks_count: int = 0
    tasks_completed_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class MilestoneListResponse(BaseModel):
    total: int
    milestones: List[MilestoneResponse]
