"""
Project Service Layer
Handles business logic for project CRUD operations
"""
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.project import Project, ProjectStatus, VALID_STATUS_TRANSITIONS
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectStatusUpdate


class ProjectService:
    """
    Service class for project-related operations.
    """

    @staticmethod
    def create_project(
        db: Session,
        project_data: ProjectCreate,
        user: User
    ) -> Project:
        """
        Create a new project for a user.
        
        Args:
            db: Database session
            project_data: Project creation data
            user: The user creating the project
            
        Returns:
            Created project
        """
        db_project = Project(
            user_id=user.id,
            title=project_data.title,
            description=project_data.description,
            category=project_data.category,
            technologies=project_data.technologies or [],
            github_url=project_data.github_url,
            demo_url=project_data.demo_url,
            status=ProjectStatus.DRAFT.value
        )
        
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        
        return db_project

    @staticmethod
    def get_project_by_id(
        db: Session,
        project_id: UUID
    ) -> Optional[Project]:
        """
        Get a project by its ID.
        
        Args:
            db: Database session
            project_id: Project UUID
            
        Returns:
            Project if found, None otherwise
        """
        return db.query(Project).filter(Project.id == project_id).first()

    @staticmethod
    def get_project_with_owner_check(
        db: Session,
        project_id: UUID,
        user: User
    ) -> Project:
        """
        Get a project and verify ownership.
        
        Args:
            db: Database session
            project_id: Project UUID
            user: User to verify ownership
            
        Returns:
            Project if found and owned by user
            
        Raises:
            HTTPException 404: If project not found
            HTTPException 403: If user doesn't own the project
        """
        project = ProjectService.get_project_by_id(db, project_id)
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        if project.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this project"
            )
        
        return project

    @staticmethod
    def get_user_projects(
        db: Session,
        user: User,
        status_filter: Optional[ProjectStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Project]:
        """
        Get all projects for a user with optional filtering.
        
        Args:
            db: Database session
            user: The user whose projects to retrieve
            status_filter: Optional status to filter by
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return
            
        Returns:
            List of projects
        """
        query = db.query(Project).filter(Project.user_id == user.id)
        
        if status_filter:
            query = query.filter(Project.status == status_filter.value)
        
        return query.order_by(Project.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def count_user_projects(
        db: Session,
        user: User,
        status_filter: Optional[ProjectStatus] = None
    ) -> int:
        """
        Count projects for a user with optional filtering.
        
        Args:
            db: Database session
            user: The user whose projects to count
            status_filter: Optional status to filter by
            
        Returns:
            Number of projects
        """
        query = db.query(Project).filter(Project.user_id == user.id)
        
        if status_filter:
            query = query.filter(Project.status == status_filter.value)
        
        return query.count()

    @staticmethod
    def get_user_project_stats(db: Session, user: User) -> dict:
        """
        Get project statistics for a user.
        
        Args:
            db: Database session
            user: The user
            
        Returns:
            Dictionary with project counts by status
        """
        total = ProjectService.count_user_projects(db, user)
        
        stats = {
            "total": total,
            "draft": ProjectService.count_user_projects(db, user, ProjectStatus.DRAFT),
            "submitted": ProjectService.count_user_projects(db, user, ProjectStatus.SUBMITTED),
            "under_review": ProjectService.count_user_projects(db, user, ProjectStatus.UNDER_REVIEW),
            "approved": ProjectService.count_user_projects(db, user, ProjectStatus.APPROVED),
            "changes_requested": ProjectService.count_user_projects(db, user, ProjectStatus.CHANGES_REQUESTED),
        }
        
        return stats

    @staticmethod
    def get_projects_for_review(
        db: Session,
        skip: int = 0,
        limit: int = 100
    ) -> List[Project]:
        """
        Get all projects that are pending review (submitted status).
        
        Args:
            db: Database session
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return
            
        Returns:
            List of projects awaiting review
        """
        return db.query(Project).filter(
            Project.status == ProjectStatus.SUBMITTED.value
        ).order_by(Project.submitted_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def update_project(
        db: Session,
        project: Project,
        project_data: ProjectUpdate
    ) -> Project:
        """
        Update a project's details.
        
        Args:
            db: Database session
            project: Project to update
            project_data: Update data
            
        Returns:
            Updated project
        """
        update_data = project_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(project, field, value)
        
        db.commit()
        db.refresh(project)
        
        return project

    @staticmethod
    def submit_project(db: Session, project: Project, submission_comment: Optional[str] = None) -> Project:
        """
        Submit a project for review.
        
        Args:
            db: Database session
            project: Project to submit
            submission_comment: Optional comment from author
            
        Returns:
            Updated project
            
        Raises:
            HTTPException 400: If project cannot be submitted
        """
        from datetime import datetime
        
        current_status = ProjectStatus(project.status)
        
        if ProjectStatus.SUBMITTED not in VALID_STATUS_TRANSITIONS.get(current_status, []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot submit project with status '{project.status}'"
            )
        
        # Validate project has required fields
        if not project.title or not project.title.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project must have a title before submission"
            )
        
        project.status = ProjectStatus.SUBMITTED.value
        project.submitted_at = datetime.utcnow()
        if submission_comment:
            project.submission_comment = submission_comment
        db.commit()
        db.refresh(project)
        
        return project

    @staticmethod
    def review_project(
        db: Session,
        project: Project,
        new_status: ProjectStatus,
        review_comment: Optional[str] = None
    ) -> Project:
        """
        Review a project (approve or request changes).
        
        Args:
            db: Database session
            project: Project to review
            new_status: New status (APPROVED or CHANGES_REQUESTED)
            review_comment: Optional reviewer feedback
            
        Returns:
            Updated project
            
        Raises:
            HTTPException 400: If status transition is invalid
        """
        from datetime import datetime
        
        current_status = ProjectStatus(project.status)
        
        # First transition to UNDER_REVIEW if needed
        if current_status == ProjectStatus.SUBMITTED:
            project.status = ProjectStatus.UNDER_REVIEW.value
            current_status = ProjectStatus.UNDER_REVIEW
        
        # Validate the final status transition
        if new_status not in VALID_STATUS_TRANSITIONS.get(current_status, []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot transition from '{project.status}' to '{new_status.value}'"
            )
        
        # Only allow APPROVED or CHANGES_REQUESTED as review outcomes
        if new_status not in [ProjectStatus.APPROVED, ProjectStatus.CHANGES_REQUESTED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Review must result in 'approved' or 'changes_requested' status"
            )
        
        project.status = new_status.value
        project.reviewed_at = datetime.utcnow()
        
        if review_comment:
            project.review_comment = review_comment
        
        db.commit()
        db.refresh(project)
        
        return project

    @staticmethod
    def update_project_status(
        db: Session,
        project: Project,
        status_update: ProjectStatusUpdate
    ) -> Project:
        """
        Update a project's status (reviewer action).
        
        Args:
            db: Database session
            project: Project to update
            status_update: New status and optional comment
            
        Returns:
            Updated project
            
        Raises:
            HTTPException 400: If status transition is invalid
        """
        current_status = ProjectStatus(project.status)
        new_status = status_update.status
        
        if new_status not in VALID_STATUS_TRANSITIONS.get(current_status, []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot transition from '{project.status}' to '{new_status.value}'"
            )
        
        project.status = new_status.value
        
        if status_update.review_comment:
            project.review_comment = status_update.review_comment
        
        db.commit()
        db.refresh(project)
        
        return project

    @staticmethod
    def delete_project(db: Session, project: Project) -> None:
        """
        Delete a project.
        
        Args:
            db: Database session
            project: Project to delete
        """
        db.delete(project)
        db.commit()


# Create singleton instance for easy importing
project_service = ProjectService()
