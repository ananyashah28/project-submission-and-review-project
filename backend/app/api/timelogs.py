"""
TimeLog API endpoints (Zoho Projects Timesheet module)
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.timelog import TimeLog
from app.models.task import Task
from app.models.bug import Bug
from app.models.activity import ActivityLog
from app.schemas.timelog import (
    TimeLogCreate,
    TimeLogUpdate,
    TimeLogResponse,
    TimeLogListResponse,
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


def timelog_to_response(log: TimeLog, db: Session) -> dict:
    task_title = None
    if log.task_id:
        task = db.query(Task).filter(Task.id == log.task_id).first()
        if task:
            task_title = task.title

    bug_title = None
    if log.bug_id:
        bug = db.query(Bug).filter(Bug.id == log.bug_id).first()
        if bug:
            bug_title = bug.title

    return {
        "id": log.id,
        "project_id": log.project_id,
        "task_id": log.task_id,
        "task_title": task_title,
        "bug_id": log.bug_id,
        "bug_title": bug_title,
        "user_name": log.user_name,
        "hours": log.hours,
        "date": log.date,
        "description": log.description,
        "is_billable": log.is_billable,
        "created_at": log.created_at,
        "updated_at": log.updated_at,
    }


@router.get("/projects/{project_id}/timelogs", response_model=TimeLogListResponse)
async def list_timelogs(
    project_id: UUID,
    task_id: Optional[UUID] = None,
    bug_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all time logs for a project with totals.
    """
    check_project_access(project_id, current_user, db)

    query = db.query(TimeLog).filter(TimeLog.project_id == project_id)
    if task_id:
        query = query.filter(TimeLog.task_id == task_id)
    if bug_id:
        query = query.filter(TimeLog.bug_id == bug_id)

    logs = query.order_by(TimeLog.date.desc()).all()
    log_responses = [timelog_to_response(l, db) for l in logs]

    total_hours = sum(l.hours for l in logs)
    billable_hours = sum(l.hours for l in logs if l.is_billable)

    return {
        "total_hours": round(total_hours, 2),
        "billable_hours": round(billable_hours, 2),
        "total": len(log_responses),
        "logs": log_responses,
    }


@router.post("/projects/{project_id}/timelogs", response_model=TimeLogResponse, status_code=status.HTTP_201_CREATED)
async def create_timelog(
    project_id: UUID,
    log_in: TimeLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Log hours on a project task or bug.
    """
    check_project_access(project_id, current_user, db)

    log = TimeLog(
        project_id=project_id,
        task_id=log_in.task_id,
        bug_id=log_in.bug_id,
        hours=log_in.hours,
        date=log_in.date or datetime.utcnow(),
        description=log_in.description,
        is_billable=log_in.is_billable,
        user_name=log_in.user_name or current_user.name,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    log_activity(db, project_id, "logged_time", "timelog", f"Logged {log.hours}h ({'Billable' if log.is_billable else 'Non-billable'})", current_user.name, log.id)

    return timelog_to_response(log, db)


@router.patch("/timelogs/{timelog_id}", response_model=TimeLogResponse)
async def update_timelog(
    timelog_id: UUID,
    log_in: TimeLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a time log.
    """
    log = db.query(TimeLog).filter(TimeLog.id == timelog_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Time log not found")

    check_project_access(log.project_id, current_user, db)

    if log_in.hours is not None:
        log.hours = log_in.hours
    if log_in.date is not None:
        log.date = log_in.date
    if log_in.description is not None:
        log.description = log_in.description
    if log_in.is_billable is not None:
        log.is_billable = log_in.is_billable
    if log_in.user_name is not None:
        log.user_name = log_in.user_name
    if log_in.task_id is not None:
        log.task_id = log_in.task_id
    if log_in.bug_id is not None:
        log.bug_id = log_in.bug_id

    log.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(log)

    return timelog_to_response(log, db)


@router.delete("/timelogs/{timelog_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timelog(
    timelog_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a time log.
    """
    log = db.query(TimeLog).filter(TimeLog.id == timelog_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Time log not found")

    check_project_access(log.project_id, current_user, db)

    project_id = log.project_id
    hours = log.hours

    db.delete(log)
    db.commit()

    log_activity(db, project_id, "deleted", "timelog", f"Deleted time log ({hours}h)", current_user.name)

    return None
