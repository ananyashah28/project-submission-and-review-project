"""
SQLAlchemy database models

Import all models here to ensure they are registered with Base.metadata
before Alembic generates migrations.
"""
from app.core.database import Base

from app.models.user import User
from app.models.project import Project, ProjectStatus, VALID_STATUS_TRANSITIONS
from app.models.file import ProjectFile
from app.models.refresh_token import RefreshToken
from app.models.task import Task, Subtask, TaskStatus, TaskPriority
from app.models.bug import Bug, BugSeverity, BugStatus
from app.models.milestone import Milestone, MilestoneStatus
from app.models.timelog import TimeLog
from app.models.activity import ActivityLog
from app.models.project_member import ProjectMember, ProjectRole

__all__ = [
    "Base",
    "User",
    "Project",
    "ProjectStatus",
    "VALID_STATUS_TRANSITIONS",
    "ProjectFile",
    "RefreshToken",
    "Task",
    "Subtask",
    "TaskStatus",
    "TaskPriority",
    "Bug",
    "BugSeverity",
    "BugStatus",
    "Milestone",
    "MilestoneStatus",
    "TimeLog",
    "ActivityLog",
    "ProjectMember",
    "ProjectRole",
]
