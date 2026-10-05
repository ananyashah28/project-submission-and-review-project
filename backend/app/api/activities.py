"""
Activity Feed API endpoints (Zoho Projects Audit Trail)
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.activity import ActivityLog
from app.schemas.activity import ActivityLogListResponse

router = APIRouter()


def check_project_access(project_id: UUID, user: User, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this project")
    return project


@router.get("/projects/{project_id}/activities", response_model=ActivityLogListResponse)
async def list_activities(
    project_id: UUID,
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List activity feed events for a project.
    """
    check_project_access(project_id, current_user, db)

    activities = (
        db.query(ActivityLog)
        .filter(ActivityLog.project_id == project_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
        .all()
    )

    return {
        "total": len(activities),
        "activities": activities,
    }
