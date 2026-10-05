"""
TimeLog database model (Zoho Projects Timesheet module)
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class TimeLog(Base):
    """
    TimeLog model for logging hours on tasks or bugs.
    """
    __tablename__ = "time_logs"

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
    bug_id = Column(
        UUID(as_uuid=True),
        ForeignKey("bugs.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    user_name = Column(String(100), nullable=False)
    hours = Column(Float, nullable=False, default=1.0)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    description = Column(Text, nullable=True)
    is_billable = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="time_logs")
    task = relationship("Task", back_populates="time_logs")
    bug = relationship("Bug", back_populates="time_logs")

    def __repr__(self):
        return f"<TimeLog(id={self.id}, hours={self.hours}, user={self.user_name})>"
