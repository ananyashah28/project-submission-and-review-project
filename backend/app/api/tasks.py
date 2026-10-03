"""
Task and Subtask API endpoints
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
from app.models.task import Task, Subtask, TaskStatus, TaskPriority
from app.models.bug import Bug
from app.models.milestone import Milestone
from app.models.activity import ActivityLog
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskDetailResponse,
    TaskListResponse,
    SubtaskCreate,
    SubtaskUpdate,
    SubtaskResponse,
)

from app.models.project_member import ProjectMember

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


def task_to_response(task: Task, db: Session) -> dict:
    subtasks = db.query(Subtask).filter(Subtask.task_id == task.id).all()
    subtasks_count = len(subtasks)
    subtasks_completed_count = sum(1 for s in subtasks if s.is_completed)
    bugs_count = db.query(Bug).filter(Bug.task_id == task.id).count()

    milestone_title = None
    if task.milestone_id:
        m = db.query(Milestone).filter(Milestone.id == task.milestone_id).first()
        if m:
            milestone_title = m.title

    assignee_name = task.assigned_to
    assignee_email = None
    if task.assignee_id:
        u = db.query(User).filter(User.id == task.assignee_id).first()
        if u:
            assignee_name = u.name
            assignee_email = u.email

    return {
        "id": task.id,
        "project_id": task.project_id,
        "milestone_id": task.milestone_id,
        "milestone_title": milestone_title,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "due_date": task.due_date,
        "assigned_to": assignee_name,
        "assignee_id": task.assignee_id,
        "assignee_name": assignee_name,
        "assignee_email": assignee_email,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "subtasks_count": subtasks_count,
        "subtasks_completed_count": subtasks_completed_count,
        "bugs_count": bugs_count,
    }


# ==========================================
# Task Endpoints
# ==========================================

@router.get("/projects/{project_id}/tasks", response_model=TaskListResponse)
async def list_tasks(
    project_id: UUID,
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    milestone_id: Optional[UUID] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List tasks for a project with optional filters.
    """
    check_project_access(project_id, current_user, db)

    query = db.query(Task).filter(Task.project_id == project_id)

    if status_filter:
        query = query.filter(Task.status == status_filter)
    if priority_filter:
        query = query.filter(Task.priority == priority_filter)
    if milestone_id:
        query = query.filter(Task.milestone_id == milestone_id)
    if search:
        query = query.filter(Task.title.ilike(f"%{search}%"))

    tasks = query.order_by(Task.created_at.desc()).all()
    task_responses = [task_to_response(t, db) for t in tasks]

    return {
        "total": len(task_responses),
        "tasks": task_responses,
    }


@router.post("/projects/{project_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    project_id: UUID,
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new task within a project.
    """
    check_project_access(project_id, current_user, db)

    assignee_name = task_in.assigned_to
    if task_in.assignee_id:
        target_user = db.query(User).filter(User.id == task_in.assignee_id).first()
        if target_user:
            assignee_name = target_user.name

    task = Task(
        project_id=project_id,
        title=task_in.title,
        description=task_in.description,
        status=task_in.status.value if task_in.status else TaskStatus.TODO.value,
        priority=task_in.priority.value if task_in.priority else TaskPriority.MEDIUM.value,
        due_date=task_in.due_date,
        assignee_id=task_in.assignee_id,
        assigned_to=assignee_name or (current_user.name if not task_in.assignee_id else None),
        milestone_id=task_in.milestone_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    log_activity(db, project_id, "created", "task", f"Created task '{task.title}'", current_user.name, task.id)

    return task_to_response(task, db)


@router.get("/tasks/{task_id}", response_model=TaskDetailResponse)
async def get_task_detail(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get detailed task with subtasks list.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    check_project_access(task.project_id, current_user, db)

    subtasks = db.query(Subtask).filter(Subtask.task_id == task.id).order_by(Subtask.created_at.asc()).all()

    milestone_title = None
    if task.milestone_id:
        m = db.query(Milestone).filter(Milestone.id == task.milestone_id).first()
        if m:
            milestone_title = m.title

    assignee_name = task.assigned_to
    assignee_email = None
    if task.assignee_id:
        u = db.query(User).filter(User.id == task.assignee_id).first()
        if u:
            assignee_name = u.name
            assignee_email = u.email

    return {
        "id": task.id,
        "project_id": task.project_id,
        "milestone_id": task.milestone_id,
        "milestone_title": milestone_title,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "due_date": task.due_date,
        "assigned_to": assignee_name,
        "assignee_id": task.assignee_id,
        "assignee_name": assignee_name,
        "assignee_email": assignee_email,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "subtasks": subtasks,
    }


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing task.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    check_project_access(task.project_id, current_user, db)

    old_status = task.status

    if task_in.title is not None:
        task.title = task_in.title
    if task_in.description is not None:
        task.description = task_in.description
    if task_in.status is not None:
        task.status = task_in.status.value
    if task_in.priority is not None:
        task.priority = task_in.priority.value
    if task_in.due_date is not None:
        task.due_date = task_in.due_date
    if task_in.assignee_id is not None:
        task.assignee_id = task_in.assignee_id
        target_user = db.query(User).filter(User.id == task_in.assignee_id).first()
        if target_user:
            task.assigned_to = target_user.name
    elif task_in.assigned_to is not None:
        task.assigned_to = task_in.assigned_to
        if not task_in.assigned_to:
            task.assignee_id = None
    if task_in.milestone_id is not None:
        task.milestone_id = task_in.milestone_id

    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)

    if task_in.status is not None and task_in.status.value != old_status:
        log_activity(db, task.project_id, "moved", "task", f"Moved task '{task.title}' to {task.status.replace('_', ' ')}", current_user.name, task.id)
    else:
        log_activity(db, task.project_id, "updated", "task", f"Updated task '{task.title}'", current_user.name, task.id)

    return task_to_response(task, db)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a task.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    check_project_access(task.project_id, current_user, db)

    project_id = task.project_id
    task_title = task.title

    db.delete(task)
    db.commit()

    log_activity(db, project_id, "deleted", "task", f"Deleted task '{task_title}'", current_user.name)

    return None


# ==========================================
# Subtask Endpoints
# ==========================================

@router.post("/tasks/{task_id}/subtasks", response_model=SubtaskResponse, status_code=status.HTTP_201_CREATED)
async def create_subtask(
    task_id: UUID,
    subtask_in: SubtaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Add a subtask to a task.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    check_project_access(task.project_id, current_user, db)

    subtask = Subtask(
        task_id=task_id,
        title=subtask_in.title,
        is_completed=False,
        due_date=subtask_in.due_date,
    )
    db.add(subtask)
    db.commit()
    db.refresh(subtask)

    log_activity(db, task.project_id, "created", "subtask", f"Added subtask '{subtask.title}' to '{task.title}'", current_user.name, subtask.id)

    return subtask


@router.patch("/subtasks/{subtask_id}", response_model=SubtaskResponse)
async def update_subtask(
    subtask_id: UUID,
    subtask_in: SubtaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a subtask (e.g. toggle completion or edit title).
    """
    subtask = db.query(Subtask).filter(Subtask.id == subtask_id).first()
    if not subtask:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtask not found")

    task = db.query(Task).filter(Task.id == subtask.task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated task not found")

    check_project_access(task.project_id, current_user, db)

    if subtask_in.title is not None:
        subtask.title = subtask_in.title
    if subtask_in.is_completed is not None:
        subtask.is_completed = subtask_in.is_completed
    if subtask_in.due_date is not None:
        subtask.due_date = subtask_in.due_date

    subtask.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(subtask)

    status_str = "completed" if subtask.is_completed else "reopened"
    log_activity(db, task.project_id, "updated", "subtask", f"Marked subtask '{subtask.title}' as {status_str}", current_user.name, subtask.id)

    return subtask


@router.delete("/subtasks/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subtask(
    subtask_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a subtask.
    """
    subtask = db.query(Subtask).filter(Subtask.id == subtask_id).first()
    if not subtask:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtask not found")

    task = db.query(Task).filter(Task.id == subtask.task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated task not found")

    check_project_access(task.project_id, current_user, db)

    subtask_title = subtask.title
    project_id = task.project_id

    db.delete(subtask)
    db.commit()

    log_activity(db, project_id, "deleted", "subtask", f"Deleted subtask '{subtask_title}'", current_user.name)

    return None
