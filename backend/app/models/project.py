"""
Project database model
"""
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import List, Optional

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship

from app.core.database import Base


class ProjectStatus(str, PyEnum):
    """
    Enum for project submission status.
    """
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    CHANGES_REQUESTED = "changes_requested"


# Valid status transitions map
VALID_STATUS_TRANSITIONS = {
    ProjectStatus.DRAFT: [ProjectStatus.SUBMITTED],
    ProjectStatus.SUBMITTED: [ProjectStatus.UNDER_REVIEW, ProjectStatus.DRAFT],
    ProjectStatus.UNDER_REVIEW: [ProjectStatus.APPROVED, ProjectStatus.CHANGES_REQUESTED],
    ProjectStatus.APPROVED: [],
    ProjectStatus.CHANGES_REQUESTED: [ProjectStatus.SUBMITTED],
}

# Status descriptions for UI
STATUS_DESCRIPTIONS = {
    ProjectStatus.DRAFT: "Project is in draft mode and can be edited",
    ProjectStatus.SUBMITTED: "Project has been submitted for review",
    ProjectStatus.UNDER_REVIEW: "Project is currently being reviewed",
    ProjectStatus.APPROVED: "Project has been approved",
    ProjectStatus.CHANGES_REQUESTED: "Reviewer has requested changes",
}


def get_valid_transitions(current_status: ProjectStatus) -> List[ProjectStatus]:
    """
    Get list of valid status transitions from current status.
    
    Args:
        current_status: The current project status
        
    Returns:
        List of valid target statuses
    """
    return VALID_STATUS_TRANSITIONS.get(current_status, [])


def is_valid_transition(current_status: ProjectStatus, new_status: ProjectStatus) -> bool:
    """
    Check if a status transition is valid.
    
    Args:
        current_status: The current project status
        new_status: The target status
        
    Returns:
        True if transition is valid, False otherwise
    """
    return new_status in get_valid_transitions(current_status)


def can_user_edit(status: ProjectStatus) -> bool:
    """
    Check if user can edit project based on status.
    
    Args:
        status: The current project status
        
    Returns:
        True if project can be edited, False otherwise
    """
    return status in [ProjectStatus.DRAFT, ProjectStatus.CHANGES_REQUESTED]


def can_user_submit(status: ProjectStatus) -> bool:
    """
    Check if user can submit project for review.
    
    Args:
        status: The current project status
        
    Returns:
        True if project can be submitted, False otherwise
    """
    return status in [ProjectStatus.DRAFT, ProjectStatus.CHANGES_REQUESTED]


def can_reviewer_review(status: ProjectStatus) -> bool:
    """
    Check if reviewer can review the project.
    
    Args:
        status: The current project status
        
    Returns:
        True if project can be reviewed, False otherwise
    """
    return status in [ProjectStatus.SUBMITTED, ProjectStatus.UNDER_REVIEW]


class Project(Base):
    """
    Project model for storing project information.
    
    Attributes:
        id: Unique identifier (UUID)
        user_id: Foreign key to the project owner
        title: Project title
        description: Detailed project description
        category: Project category
        technologies: List of technologies used
        github_url: Link to GitHub repository
        demo_url: Link to live demo
        status: Current submission status
        review_comment: Feedback from reviewer
        submitted_at: When project was submitted for review
        reviewed_at: When project was last reviewed
        created_at: Project creation timestamp
        updated_at: Last update timestamp
        
    Relationships:
        owner: The user who owns this project
        files: List of files associated with this project
    """
    __tablename__ = "projects"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    technologies = Column(ARRAY(String), nullable=True, default=list)
    github_url = Column(String(500), nullable=True)
    demo_url = Column(String(500), nullable=True)
    status = Column(
        String(50),
        default=ProjectStatus.DRAFT.value,
        nullable=False,
        index=True
    )
    review_comment = Column(Text, nullable=True)
    submission_comment = Column(Text, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, onupdate=datetime.utcnow, nullable=True)

    # Relationships
    owner = relationship("User", back_populates="projects")
    files = relationship(
        "ProjectFile",
        back_populates="project",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Project(id={self.id}, title={self.title}, status={self.status})>"

    @property
    def status_enum(self) -> ProjectStatus:
        """Get status as enum."""
        return ProjectStatus(self.status)

    def can_transition_to(self, new_status: ProjectStatus) -> bool:
        """
        Check if the project can transition to the given status.
        
        Args:
            new_status: The target status
            
        Returns:
            True if transition is valid, False otherwise
        """
        return is_valid_transition(self.status_enum, new_status)

    def can_edit(self) -> bool:
        """Check if project can be edited."""
        return can_user_edit(self.status_enum)

    def can_submit(self) -> bool:
        """Check if project can be submitted for review."""
        return can_user_submit(self.status_enum)

    def can_review(self) -> bool:
        """Check if project can be reviewed."""
        return can_reviewer_review(self.status_enum)
