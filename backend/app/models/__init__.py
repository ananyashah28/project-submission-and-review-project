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

__all__ = [
    "Base",
    "User",
    "Project",
    "ProjectStatus",
    "VALID_STATUS_TRANSITIONS",
    "ProjectFile",
    "RefreshToken",
]
