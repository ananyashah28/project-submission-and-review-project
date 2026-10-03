"""
Project Members API Endpoints (Zoho Projects & Jira style Team Collaboration)
"""
from typing import List
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.project_member import ProjectMember, ProjectRole
from app.models.activity import ActivityLog
from app.schemas.project_member import (
    ProjectMemberCreate,
    ProjectMemberUpdate,
    ProjectMemberResponse,
    ProjectMemberListResponse,
)

router = APIRouter(prefix="/projects/{project_id}/members", tags=["Project Team Members"])


def _check_project_access(project_id: UUID, db: Session, current_user: User) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    # Check if user is owner or member
    if project.user_id != current_user.id:
        membership = db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id
        ).first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this project"
            )
    return project


@router.get("", response_model=ProjectMemberListResponse)
async def list_project_members(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all team members of a project workspace, including the project owner.
    """
    project = _check_project_access(project_id, db, current_user)

    # Fetch all project members joined with User
    members_query = (
        db.query(ProjectMember, User)
        .join(User, ProjectMember.user_id == User.id)
        .filter(ProjectMember.project_id == project_id)
        .order_by(ProjectMember.joined_at.asc())
        .all()
    )

    owner_user = db.query(User).filter(User.id == project.user_id).first()

    member_responses = []
    owner_included = False

    # Check if owner is in the members list
    for pm, user in members_query:
        is_owner = (user.id == project.user_id)
        if is_owner:
            owner_included = True
        member_responses.append(
            ProjectMemberResponse(
                id=pm.id,
                project_id=pm.project_id,
                user_id=user.id,
                name=user.name,
                email=user.email,
                role="owner" if is_owner else pm.role,
                joined_at=pm.joined_at,
                is_owner=is_owner
            )
        )

    # If owner wasn't in ProjectMember table, prepend owner
    if not owner_included and owner_user:
        member_responses.insert(
            0,
            ProjectMemberResponse(
                id=project.id,  # synthetic id for owner representation
                project_id=project.id,
                user_id=owner_user.id,
                name=owner_user.name,
                email=owner_user.email,
                role="owner",
                joined_at=project.created_at,
                is_owner=True
            )
        )

    return ProjectMemberListResponse(
        total=len(member_responses),
        members=member_responses
    )


@router.post("", response_model=ProjectMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_project_member(
    project_id: UUID,
    member_data: ProjectMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add / invite a user to the project team by email or user_id.
    """
    project = _check_project_access(project_id, db, current_user)

    # Find the target user
    target_user = None
    if member_data.email:
        target_user = db.query(User).filter(User.email == member_data.email.lower()).first()
    elif member_data.user_id:
        target_user = db.query(User).filter(User.id == member_data.user_id).first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found with the provided email or ID"
        )

    # Check if target user is project owner
    if target_user.id == project.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already the owner of this project"
        )

    # Check if already a member
    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == target_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{target_user.name} is already a member of this project"
        )

    role_val = member_data.role if member_data.role in ["admin", "member", "viewer"] else "member"
    new_member = ProjectMember(
        project_id=project_id,
        user_id=target_user.id,
        role=role_val,
        joined_at=datetime.utcnow()
    )
    db.add(new_member)

    # Log activity
    act = ActivityLog(
        project_id=project_id,
        action="member_added",
        entity_type="member",
        entity_id=new_member.id,
        entity_title=f"{target_user.name} ({role_val})",
        user_name=current_user.name
    )
    db.add(act)

    db.commit()
    db.refresh(new_member)

    return ProjectMemberResponse(
        id=new_member.id,
        project_id=new_member.project_id,
        user_id=target_user.id,
        name=target_user.name,
        email=target_user.email,
        role=new_member.role,
        joined_at=new_member.joined_at,
        is_owner=False
    )


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def remove_project_member(
    project_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a member from the project team.
    """
    project = _check_project_access(project_id, db, current_user)

    if user_id == project.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the project owner from the team"
        )

    membership = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not a member of this project"
        )

    target_user = db.query(User).filter(User.id == user_id).first()
    user_name = target_user.name if target_user else "User"

    db.delete(membership)

    # Log activity
    act = ActivityLog(
        project_id=project_id,
        action="member_removed",
        entity_type="member",
        entity_id=membership.id,
        entity_title=user_name,
        user_name=current_user.name
    )
    db.add(act)

    db.commit()

    return {"message": f"{user_name} removed from the project team"}


@router.patch("/{user_id}", response_model=ProjectMemberResponse)
async def update_member_role(
    project_id: UUID,
    user_id: UUID,
    data: ProjectMemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a member's role (admin, member, viewer).
    """
    project = _check_project_access(project_id, db, current_user)

    if user_id == project.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change role of project owner"
        )

    membership = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )

    if data.role not in ["admin", "member", "viewer"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'admin', 'member', or 'viewer'"
        )

    membership.role = data.role
    db.commit()
    db.refresh(membership)

    target_user = db.query(User).filter(User.id == user_id).first()

    return ProjectMemberResponse(
        id=membership.id,
        project_id=membership.project_id,
        user_id=target_user.id,
        name=target_user.name,
        email=target_user.email,
        role=membership.role,
        joined_at=membership.joined_at,
        is_owner=False
    )
