"""
Pydantic schemas for Project-related requests and responses
"""
from datetime import datetime
from uuid import UUID
from typing import Optional, List

from pydantic import BaseModel, Field, HttpUrl, ConfigDict

from app.models.project import ProjectStatus


class ProjectBase(BaseModel):
    """
    Base schema with shared project attributes.
    """
    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Project title"
    )
    description: Optional[str] = Field(
        None,
        max_length=5000,
        description="Detailed project description"
    )
    category: Optional[str] = Field(
        None,
        max_length=100,
        description="Project category"
    )
    technologies: Optional[List[str]] = Field(
        default_factory=list,
        description="List of technologies used"
    )
    github_url: Optional[str] = Field(
        None,
        max_length=500,
        description="GitHub repository URL"
    )
    demo_url: Optional[str] = Field(
        None,
        max_length=500,
        description="Live demo URL"
    )


class ProjectCreate(ProjectBase):
    """
    Schema for creating a new project.
    """
    pass


class ProjectUpdate(BaseModel):
    """
    Schema for updating an existing project.
    All fields are optional.
    """
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    category: Optional[str] = Field(None, max_length=100)
    technologies: Optional[List[str]] = None
    github_url: Optional[str] = Field(None, max_length=500)
    demo_url: Optional[str] = Field(None, max_length=500)


class ProjectStatusUpdate(BaseModel):
    """
    Schema for updating project status (used by reviewers).
    """
    status: ProjectStatus
    review_comment: Optional[str] = Field(
        None,
        max_length=2000,
        description="Reviewer's feedback"
    )


class ProjectSubmitRequest(BaseModel):
    """
    Schema for submitting a project for review.
    """
    submission_comment: Optional[str] = Field(
        None,
        max_length=2000,
        description="Optional comment from the author about the submission"
    )


class ProjectSubmitResponse(BaseModel):
    """
    Schema for submit for review response.
    """
    id: UUID
    status: ProjectStatus
    submitted_at: datetime
    message: str = "Project submitted for review successfully"


class ProjectReviewRequest(BaseModel):
    """
    Schema for reviewer to review a project.
    """
    status: ProjectStatus = Field(
        ...,
        description="New status (approved or changes_requested)"
    )
    review_comment: Optional[str] = Field(
        None,
        max_length=2000,
        description="Reviewer's feedback"
    )


class ProjectReviewResponse(BaseModel):
    """
    Schema for review response.
    """
    id: UUID
    status: ProjectStatus
    review_comment: Optional[str]
    reviewed_at: datetime
    message: str


class ProjectResponse(ProjectBase):
    """
    Schema for project data in API responses.
    """
    id: UUID
    user_id: UUID
    status: ProjectStatus
    review_comment: Optional[str] = None
    submission_comment: Optional[str] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    can_edit: bool = False
    can_submit: bool = False

    model_config = ConfigDict(from_attributes=True)


class ProjectListResponse(BaseModel):
    """
    Schema for project list in API responses.
    Simplified version without full details.
    """
    id: UUID
    title: str
    category: Optional[str] = None
    status: ProjectStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProjectWithFiles(ProjectResponse):
    """
    Schema for project with associated files.
    Used in detailed project view.
    """
    files: List["FileResponse"] = []

    model_config = ConfigDict(from_attributes=True)


class ProjectStatsResponse(BaseModel):
    """
    Schema for project statistics.
    """
    total: int = 0
    draft: int = 0
    submitted: int = 0
    under_review: int = 0
    approved: int = 0
    changes_requested: int = 0


# Import here to avoid circular imports
from app.schemas.file import FileResponse
ProjectWithFiles.model_rebuild()
