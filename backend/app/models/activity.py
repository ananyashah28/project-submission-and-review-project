"""
ActivityLog database model (Zoho Projects Activity Feed & Audit Trail)
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class ActivityLog(Base):
    """
    ActivityLog model for tracking changes and events in the project.
    """
    __tablename__ = "activity_logs"

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
    action = Column(String(100), nullable=False)  # e.g., "created", "updated", "completed", "deleted"
    entity_type = Column(String(50), nullable=False)  # e.g., "task", "subtask", "bug", "milestone", "timelog"
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    details = Column(String(500), nullable=False)
    user_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    project = relationship("Project", back_populates="activity_logs")

    def __repr__(self):
        return f"<ActivityLog(id={self.id}, action={self.action}, entity={self.entity_type})>"
