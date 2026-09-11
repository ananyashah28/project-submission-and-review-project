"""
Project API endpoints
Handles project CRUD operations
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.project import ProjectStatus
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
    ProjectWithFiles,
    ProjectStatusUpdate,
    ProjectSubmitRequest,
    ProjectSubmitResponse,
    ProjectReviewRequest,
    ProjectReviewResponse,
    ProjectStatsResponse,
)
from app.services.project_service import project_service

router = APIRouter()


def project_to_response(project) -> dict:
    """Convert project model to response with computed fields."""
    return {
        "id": project.id,
        "user_id": project.user_id,
        "title": project.title,
        "description": project.description,
        "category": project.category,
        "technologies": project.technologies or [],
        "github_url": project.github_url,
        "demo_url": project.demo_url,
        "status": project.status,
        "review_comment": project.review_comment,
        "submission_comment": project.submission_comment,
        "submitted_at": project.submitted_at,
        "reviewed_at": project.reviewed_at,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "can_edit": project.can_edit(),
        "can_submit": project.can_submit(),
    }


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new project.
    
    Args:
        project_data: Project creation data
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Created project
    """
    project = project_service.create_project(db, project_data, current_user)
    return project_to_response(project)


@router.get("", response_model=List[ProjectListResponse])
async def list_projects(
    status_filter: Optional[ProjectStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all projects for the current user.
    
    Args:
        status_filter: Optional status to filter by
        skip: Number of records to skip
        limit: Maximum number of records to return
        db: Database session
        current_user: Authenticated user
        
    Returns:
        List of projects
    """
    projects = project_service.get_user_projects(
        db, current_user, status_filter, skip, limit
    )
    return projects


@router.get("/review/pending", response_model=List[ProjectListResponse])
async def get_projects_for_review(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all projects pending review (submitted status).
    
    Note: In production, this would require reviewer permissions.
    For now, any authenticated user can access this for testing.
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        db: Database session
        current_user: Authenticated user
        
    Returns:
        List of projects awaiting review
    """
    projects = project_service.get_projects_for_review(db, skip, limit)
    return projects


@router.get("/stats", response_model=ProjectStatsResponse)
async def get_project_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get project statistics for the current user.
    
    Args:
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Project counts by status
    """
    stats = project_service.get_user_project_stats(db, current_user)
    return stats


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific project with its files.
    
    Args:
        project_id: Project UUID
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Project with files
        
    Raises:
        HTTPException 404: If project not found
        HTTPException 403: If user doesn't own the project
    """
    project = project_service.get_project_with_owner_check(
        db, project_id, current_user
    )
    return project_to_response(project)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a project's details.
    
    Args:
        project_id: Project UUID
        project_data: Update data
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Updated project
        
    Raises:
        HTTPException 404: If project not found
        HTTPException 403: If user doesn't own the project
        HTTPException 400: If project cannot be edited
    """
    project = project_service.get_project_with_owner_check(
        db, project_id, current_user
    )
    
    # Check if project can be edited
    if not project.can_edit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot edit project with status '{project.status}'. Only draft or changes_requested projects can be edited."
        )
    
    updated_project = project_service.update_project(db, project, project_data)
    return project_to_response(updated_project)


@router.post("/{project_id}/submit", response_model=ProjectSubmitResponse)
async def submit_project(
    project_id: UUID,
    submit_data: Optional[ProjectSubmitRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit a project for review.
    
    Args:
        project_id: Project UUID
        submit_data: Optional submission comment
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Updated project with submitted status
        
    Raises:
        HTTPException 404: If project not found
        HTTPException 403: If user doesn't own the project
        HTTPException 400: If project cannot be submitted
    """
    project = project_service.get_project_with_owner_check(
        db, project_id, current_user
    )
    submission_comment = submit_data.submission_comment if submit_data else None
    submitted_project = project_service.submit_project(db, project, submission_comment)
    
    return ProjectSubmitResponse(
        id=submitted_project.id,
        status=submitted_project.status,
        submitted_at=submitted_project.submitted_at,
        message="Project submitted for review successfully"
    )


@router.post("/{project_id}/review", response_model=ProjectReviewResponse)
async def review_project(
    project_id: UUID,
    review_data: ProjectReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Review a project (approve or request changes).
    
    Note: In a full implementation, this would require reviewer permissions.
    For now, project owners can also review for testing purposes.
    
    Args:
        project_id: Project UUID
        review_data: Review decision and optional comment
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Updated project with review result
        
    Raises:
        HTTPException 404: If project not found
        HTTPException 400: If review is invalid
    """
    project = project_service.get_project_by_id(db, project_id)
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # For testing, allow any authenticated user to review
    # In production, add reviewer role check here
    # if project.user_id == current_user.id:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="You cannot review your own project"
    #     )
    
    reviewed_project = project_service.review_project(
        db, project, review_data.status, review_data.review_comment
    )
    
    status_message = "approved" if review_data.status == ProjectStatus.APPROVED else "returned for changes"
    
    return ProjectReviewResponse(
        id=reviewed_project.id,
        status=reviewed_project.status,
        review_comment=reviewed_project.review_comment,
        reviewed_at=reviewed_project.reviewed_at,
        message=f"Project has been {status_message}"
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a project.
    
    Args:
        project_id: Project UUID
        db: Database session
        current_user: Authenticated user
        
    Raises:
        HTTPException 404: If project not found
        HTTPException 403: If user doesn't own the project
    """
    project = project_service.get_project_with_owner_check(
        db, project_id, current_user
    )
    project_service.delete_project(db, project)
    return None
