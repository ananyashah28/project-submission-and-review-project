"""
Bug Tracker API endpoints (Zoho Projects style Issue Tracker)
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.task import Task
from app.models.bug import Bug, BugSeverity, BugStatus
from app.schemas.bug import (
    BugCreate,
    BugUpdate,
    BugResponse,
    BugListResponse,
)

router = APIRouter()


def check_project_access(project_id: UUID, user: User, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.user_id != user.id:
        is_member = db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user.id
        ).first()
        if not is_member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this project")
    return project


def bug_to_response(bug: Bug, db: Session) -> dict:
    task_title = None
    if bug.task_id:
        task = db.query(Task).filter(Task.id == bug.task_id).first()
        if task:
            task_title = task.title

    assignee_name = bug.assigned_to
    assignee_email = None
    if bug.assignee_id:
        u = db.query(User).filter(User.id == bug.assignee_id).first()
        if u:
            assignee_name = u.name
            assignee_email = u.email

    return {
        "id": bug.id,
        "project_id": bug.project_id,
        "task_id": bug.task_id,
        "task_title": task_title,
        "title": bug.title,
        "description": bug.description,
        "reproduction_steps": bug.reproduction_steps,
        "severity": bug.severity,
        "status": bug.status,
        "reported_by": bug.reported_by,
        "assigned_to": assignee_name,
        "assignee_id": bug.assignee_id,
        "assignee_name": assignee_name,
        "assignee_email": assignee_email,
        "created_at": bug.created_at,
        "updated_at": bug.updated_at,
    }


@router.get("/projects/{project_id}/bugs", response_model=BugListResponse)
async def list_bugs(
    project_id: UUID,
    status_filter: Optional[str] = Query(None, alias="status"),
    severity_filter: Optional[str] = Query(None, alias="severity"),
    task_id: Optional[UUID] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all bugs for a project with optional filters.
    """
    check_project_access(project_id, current_user, db)

    query = db.query(Bug).filter(Bug.project_id == project_id)

    if status_filter:
        query = query.filter(Bug.status == status_filter)
    if severity_filter:
        query = query.filter(Bug.severity == severity_filter)
    if task_id:
        query = query.filter(Bug.task_id == task_id)
    if search:
        query = query.filter(Bug.title.ilike(f"%{search}%"))

    bugs = query.order_by(Bug.created_at.desc()).all()
    bug_responses = [bug_to_response(b, db) for b in bugs]

    return {
        "total": len(bug_responses),
        "bugs": bug_responses,
    }


@router.post("/projects/{project_id}/bugs", response_model=BugResponse, status_code=status.HTTP_201_CREATED)
async def create_bug(
    project_id: UUID,
    bug_in: BugCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new bug report for a project, optionally linked to a task.
    """
    check_project_access(project_id, current_user, db)

    # If task_id provided, ensure it belongs to this project
    if bug_in.task_id:
        task = db.query(Task).filter(Task.id == bug_in.task_id, Task.project_id == project_id).first()
        if not task:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Linked task not found in this project")

    assignee_name = bug_in.assigned_to
    if bug_in.assignee_id:
        target_user = db.query(User).filter(User.id == bug_in.assignee_id).first()
        if target_user:
            assignee_name = target_user.name

    bug = Bug(
        project_id=project_id,
        task_id=bug_in.task_id,
        title=bug_in.title,
        description=bug_in.description,
        reproduction_steps=bug_in.reproduction_steps,
        severity=bug_in.severity.value if bug_in.severity else BugSeverity.MEDIUM.value,
        status=bug_in.status.value if bug_in.status else BugStatus.OPEN.value,
        reported_by=bug_in.reported_by or current_user.name,
        assigned_to=assignee_name,
        assignee_id=bug_in.assignee_id,
    )
    db.add(bug)
    db.commit()
    db.refresh(bug)

    return bug_to_response(bug, db)


@router.get("/tasks/{task_id}/bugs", response_model=BugListResponse)
async def list_bugs_for_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all bugs linked to a specific task.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    check_project_access(task.project_id, current_user, db)

    bugs = db.query(Bug).filter(Bug.task_id == task_id).order_by(Bug.created_at.desc()).all()
    bug_responses = [bug_to_response(b, db) for b in bugs]

    return {
        "total": len(bug_responses),
        "bugs": bug_responses,
    }


@router.patch("/bugs/{bug_id}", response_model=BugResponse)
async def update_bug(
    bug_id: UUID,
    bug_in: BugUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a bug report (status, severity, description, etc.).
    """
    bug = db.query(Bug).filter(Bug.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bug not found")

    check_project_access(bug.project_id, current_user, db)

    if bug_in.title is not None:
        bug.title = bug_in.title
    if bug_in.description is not None:
        bug.description = bug_in.description
    if bug_in.reproduction_steps is not None:
        bug.reproduction_steps = bug_in.reproduction_steps
    if bug_in.severity is not None:
        bug.severity = bug_in.severity.value
    if bug_in.status is not None:
        bug.status = bug_in.status.value
    if bug_in.reported_by is not None:
        bug.reported_by = bug_in.reported_by
    if bug_in.assignee_id is not None:
        bug.assignee_id = bug_in.assignee_id
        target_user = db.query(User).filter(User.id == bug_in.assignee_id).first()
        if target_user:
            bug.assigned_to = target_user.name
    elif bug_in.assigned_to is not None:
        bug.assigned_to = bug_in.assigned_to
        if not bug_in.assigned_to:
            bug.assignee_id = None
    if bug_in.task_id is not None:
        if bug_in.task_id:
            task = db.query(Task).filter(Task.id == bug_in.task_id, Task.project_id == bug.project_id).first()
            if not task:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Linked task not found in this project")
        bug.task_id = bug_in.task_id

    bug.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(bug)

    return bug_to_response(bug, db)


@router.delete("/bugs/{bug_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bug(
    bug_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a bug report.
    """
    bug = db.query(Bug).filter(Bug.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bug not found")

    check_project_access(bug.project_id, current_user, db)

    db.delete(bug)
    db.commit()
    return None
