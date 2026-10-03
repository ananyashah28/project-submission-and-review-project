"""
Pydantic schemas for request/response validation
"""
# User schemas
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserLogin,
    UserUpdate,
    UserResponse,
    UserInDB,
)

# Project schemas
from app.schemas.project import (
    ProjectBase,
    ProjectCreate,
    ProjectUpdate,
    ProjectStatusUpdate,
    ProjectResponse,
    ProjectListResponse,
    ProjectWithFiles,
)

# File schemas
from app.schemas.file import (
    FileBase,
    FileResponse,
    FileUploadResponse,
    FileDeleteResponse,
)

# Token schemas
from app.schemas.token import (
    Token,
    TokenData,
    TokenPayload,
)

# Task and Subtask schemas
from app.schemas.task import (
    TaskBase,
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskDetailResponse,
    TaskListResponse,
    SubtaskBase,
    SubtaskCreate,
    SubtaskUpdate,
    SubtaskResponse,
)

# Bug schemas
from app.schemas.bug import (
    BugBase,
    BugCreate,
    BugUpdate,
    BugResponse,
    BugListResponse,
)

# Milestone schemas
from app.schemas.milestone import (
    MilestoneBase,
    MilestoneCreate,
    MilestoneUpdate,
    MilestoneResponse,
    MilestoneListResponse,
)

# TimeLog schemas
from app.schemas.timelog import (
    TimeLogBase,
    TimeLogCreate,
    TimeLogUpdate,
    TimeLogResponse,
    TimeLogListResponse,
)

# ActivityLog schemas
from app.schemas.activity import (
    ActivityLogResponse,
    ActivityLogListResponse,
)

__all__ = [
    # User
    "UserBase",
    "UserCreate",
    "UserLogin",
    "UserUpdate",
    "UserResponse",
    "UserInDB",
    # Project
    "ProjectBase",
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectStatusUpdate",
    "ProjectResponse",
    "ProjectListResponse",
    "ProjectWithFiles",
    # File
    "FileBase",
    "FileResponse",
    "FileUploadResponse",
    "FileDeleteResponse",
    # Token
    "Token",
    "TokenData",
    "TokenPayload",
    # Tasks
    "TaskBase",
    "TaskCreate",
    "TaskUpdate",
    "TaskResponse",
    "TaskDetailResponse",
    "TaskListResponse",
    "SubtaskBase",
    "SubtaskCreate",
    "SubtaskUpdate",
    "SubtaskResponse",
    # Bugs
    "BugBase",
    "BugCreate",
    "BugUpdate",
    "BugResponse",
    "BugListResponse",
    # Milestones
    "MilestoneBase",
    "MilestoneCreate",
    "MilestoneUpdate",
    "MilestoneResponse",
    "MilestoneListResponse",
    # TimeLog
    "TimeLogBase",
    "TimeLogCreate",
    "TimeLogUpdate",
    "TimeLogResponse",
    "TimeLogListResponse",
    # Activity
    "ActivityLogResponse",
    "ActivityLogListResponse",
]
