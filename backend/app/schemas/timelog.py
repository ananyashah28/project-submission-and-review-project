"""
Pydantic schemas for Timesheet and Time Logging operations
"""
from datetime import datetime
from uuid import UUID
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict


class TimeLogBase(BaseModel):
    hours: float = Field(..., gt=0, le=24, description="Hours worked")
    date: Optional[datetime] = None
    description: Optional[str] = Field(None, max_length=2000, description="Work description")
    is_billable: bool = Field(default=True, description="Whether time is billable")
    user_name: Optional[str] = Field(None, max_length=100, description="Logged by")
    task_id: Optional[UUID] = None
    bug_id: Optional[UUID] = None


class TimeLogCreate(TimeLogBase):
    pass


class TimeLogUpdate(BaseModel):
    hours: Optional[float] = Field(None, gt=0, le=24)
    date: Optional[datetime] = None
    description: Optional[str] = Field(None, max_length=2000)
    is_billable: Optional[bool] = None
    user_name: Optional[str] = Field(None, max_length=100)
    task_id: Optional[UUID] = None
    bug_id: Optional[UUID] = None


class TimeLogResponse(BaseModel):
    id: UUID
    project_id: UUID
    task_id: Optional[UUID] = None
    task_title: Optional[str] = None
    bug_id: Optional[UUID] = None
    bug_title: Optional[str] = None
    user_name: str
    hours: float
    date: datetime
    description: Optional[str] = None
    is_billable: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TimeLogListResponse(BaseModel):
    total_hours: float
    billable_hours: float
    total: int
    logs: List[TimeLogResponse]
