"""
User API endpoints
Handles user profile management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user's profile.
    
    Args:
        current_user: Authenticated user from token
        
    Returns:
        User profile data
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update current user's profile.
    
    Args:
        user_data: Fields to update (name, email)
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Updated user profile
        
    Raises:
        HTTPException 400: If new email already taken
    """
    # Check if email is being changed and if new email is taken
    if user_data.email and user_data.email != current_user.email:
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        current_user.email = user_data.email
    
    # Update name if provided
    if user_data.name:
        current_user.name = user_data.name
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


class PasswordChange:
    """Schema for password change request"""
    def __init__(self, current_password: str, new_password: str):
        self.current_password = current_password
        self.new_password = new_password


@router.put("/me/password", status_code=status.HTTP_200_OK)
async def change_password(
    current_password: str,
    new_password: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Change current user's password.
    
    Args:
        current_password: Current password for verification
        new_password: New password to set
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Success message
        
    Raises:
        HTTPException 400: If current password is incorrect
    """
    # Verify current password
    if not verify_password(current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Validate new password length
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters"
        )
    
    # Update password
    current_user.password_hash = get_password_hash(new_password)
    db.commit()
    
    return {"message": "Password updated successfully"}
