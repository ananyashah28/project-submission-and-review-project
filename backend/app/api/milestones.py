"""
Milestone API endpoints (Zoho Projects Milestones / Sprints)
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.milestone import Milestone, MilestoneStatus
from app.models.task import Task
from app.models.activity import ActivityLog
from app.schemas.milestone import (
    MilestoneCreate,
    MilestoneUpdate,
    MilestoneResponse,
    MilestoneListResponse,
)

router = APIRouter()


def check_project_access(project_id: UUID, user: User, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this project")
    return project


def log_activity(db: Session, project_id: UUID, action: str, entity_type: str, details: str, user_name: str, entity_id: Optional[UUID] = None):
    try:
        activity = ActivityLog(
            project_id=project_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            user_name=user_name,
        )
        db.add(activity)
        db.commit()
    except Exception:
        db.rollback()


def milestone_to_response(m: Milestone, db: Session) -> dict:
    tasks = db.query(Task).filter(Task.milestone_id == m.id).all()
    tasks_count = len(tasks)
    tasks_completed = sum(1 for t in tasks if t.status == "completed")

    return {
        "id": m.id,
        "project_id": m.project_id,
        "title": m.title,
        "description": m.description,
        "status": m.status,
        "start_date": m.start_date,
        "end_date": m.end_date,
        "created_at": m.created_at,
        "updated_at": m.updated_at,
        "tasks_count": tasks_count,
        "tasks_completed_count": tasks_completed,
    }


@router.get("/projects/{project_id}/milestones", response_model=MilestoneListResponse)
async def list_milestones(
    project_id: UUID,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List milestones for a project.
    """
    check_project_access(project_id, current_user, db)

    query = db.query(Milestone).filter(Milestone.project_id == project_id)
    if status_filter:
        query = query.filter(Milestone.status == status_filter)

    milestones = query.order_by(Milestone.created_at.desc()).all()
    milestone_responses = [milestone_to_response(m, db) for m in milestones]

    return {
        "total": len(milestone_responses),
        "milestones": milestone_responses,
    }


@router.post("/projects/{project_id}/milestones", response_model=MilestoneResponse, status_code=status.HTTP_201_CREATED)
async def create_milestone(
    project_id: UUID,
    m_in: MilestoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new milestone.
    """
    check_project_access(project_id, current_user, db)

    milestone = Milestone(
        project_id=project_id,
        title=m_in.title,
        description=m_in.description,
        status=m_in.status.value if m_in.status else MilestoneStatus.ACTIVE.value,
        start_date=m_in.start_date,
        end_date=m_in.end_date,
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)

    log_activity(db, project_id, "created", "milestone", f"Created milestone '{milestone.title}'", current_user.name, milestone.id)

    return milestone_to_response(milestone, db)


@router.patch("/milestones/{milestone_id}", response_model=MilestoneResponse)
async def update_milestone(
    milestone_id: UUID,
    m_in: MilestoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a milestone.
    """
    m = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not m:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")

    check_project_access(m.project_id, current_user, db)

    if m_in.title is not None:
        m.title = m_in.title
    if m_in.description is not None:
        m.description = m_in.description
    if m_in.status is not None:
        m.status = m_in.status.value
    if m_in.start_date is not None:
        m.start_date = m_in.start_date
    if m_in.end_date is not None:
        m.end_date = m_in.end_date

    m.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(m)

    log_activity(db, m.project_id, "updated", "milestone", f"Updated milestone '{m.title}'", current_user.name, m.id)

    return milestone_to_response(m, db)


@router.delete("/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_milestone(
    milestone_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a milestone.
    """
    m = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not m:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")

    check_project_access(m.project_id, current_user, db)

    project_id = m.project_id
    title = m.title

    db.delete(m)
    db.commit()

    log_activity(db, project_id, "deleted", "milestone", f"Deleted milestone '{title}'", current_user.name)

    return None
