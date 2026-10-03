"""
Bug database model (Zoho Projects style Issue Tracker)
"""
import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class BugSeverity(str, PyEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class BugStatus(str, PyEnum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class Bug(Base):
    """
    Bug / Issue model for tracking bugs within a project or tied to a task.
    """
    __tablename__ = "bugs"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    task_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    reproduction_steps = Column(Text, nullable=True)
    severity = Column(
        String(50),
        default=BugSeverity.MEDIUM.value,
        nullable=False
    )
    status = Column(
        String(50),
        default=BugStatus.OPEN.value,
        nullable=False,
        index=True
    )
    reported_by = Column(String(150), nullable=True)
    assigned_to = Column(String(150), nullable=True)
    assignee_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="bugs")
    assignee = relationship("User", foreign_keys=[assignee_id])
    task = relationship("Task", back_populates="bugs")
    time_logs = relationship(
        "TimeLog",
        back_populates="bug",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Bug(id={self.id}, title={self.title}, severity={self.severity}, status={self.status})>"
