"""
Pydantic schemas for Task and Subtask operations
"""
from datetime import datetime
from uuid import UUID
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict

from app.models.task import TaskStatus, TaskPriority


# ==========================================
# Subtask Schemas
# ==========================================

class SubtaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Subtask title")
    due_date: Optional[datetime] = None


class SubtaskCreate(SubtaskBase):
    pass


class SubtaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    is_completed: Optional[bool] = None
    due_date: Optional[datetime] = None


class SubtaskResponse(BaseModel):
    id: UUID
    task_id: UUID
    title: str
    is_completed: bool
    due_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Task Schemas
# ==========================================

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Task title")
    description: Optional[str] = Field(None, max_length=5000, description="Task description")
    status: Optional[TaskStatus] = Field(default=TaskStatus.TODO, description="Task status")
    priority: Optional[TaskPriority] = Field(default=TaskPriority.MEDIUM, description="Task priority")
    due_date: Optional[datetime] = None
    assigned_to: Optional[str] = Field(None, max_length=150, description="Assignee name or email")
    assignee_id: Optional[UUID] = Field(None, description="Assigned team member user ID")
    milestone_id: Optional[UUID] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=5000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    assigned_to: Optional[str] = Field(None, max_length=150)
    assignee_id: Optional[UUID] = None
    milestone_id: Optional[UUID] = None


class TaskResponse(BaseModel):
    id: UUID
    project_id: UUID
    milestone_id: Optional[UUID] = None
    milestone_title: Optional[str] = None
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    due_date: Optional[datetime] = None
    assigned_to: Optional[str] = None
    assignee_id: Optional[UUID] = None
    assignee_name: Optional[str] = None
    assignee_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    subtasks_count: int = 0
    subtasks_completed_count: int = 0
    bugs_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class TaskDetailResponse(BaseModel):
    id: UUID
    project_id: UUID
    milestone_id: Optional[UUID] = None
    milestone_title: Optional[str] = None
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    due_date: Optional[datetime] = None
    assigned_to: Optional[str] = None
    assignee_id: Optional[UUID] = None
    assignee_name: Optional[str] = None
    assignee_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    subtasks: List[SubtaskResponse] = []
    
    model_config = ConfigDict(from_attributes=True)


class TaskListResponse(BaseModel):
    total: int
    tasks: List[TaskResponse]
