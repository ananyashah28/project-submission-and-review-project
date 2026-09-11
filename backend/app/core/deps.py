"""
Dependency injection for FastAPI routes
"""
from typing import Generator, Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status, Cookie, Request
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.user import User


def get_db() -> Generator[Session, None, None]:
    """
    Dependency that provides a database session.
    Ensures the session is closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    access_token: Optional[str] = Cookie(None)
) -> User:
    """
    Dependency that validates JWT token from cookie and returns current user.
    
    Args:
        request: FastAPI request object
        db: Database session
        access_token: JWT token from httpOnly cookie
        
    Returns:
        User object if token is valid
        
    Raises:
        HTTPException 401: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    
    if not access_token:
        raise credentials_exception
    
    try:
        # Decode the JWT token
        payload = jwt.decode(
            access_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_uuid).first()
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency that ensures user is active.
    This is an alias for get_current_user that explicitly checks active status.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_optional_current_user(
    request: Request,
    db: Session = Depends(get_db),
    access_token: Optional[str] = Cookie(None)
) -> Optional[User]:
    """
    Dependency that optionally returns current user.
    Returns None if no token provided or token is invalid.
    Useful for endpoints that have different behavior for authenticated vs anonymous users.
    """
    if not access_token:
        return None
    
    try:
        payload = jwt.decode(
            access_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        
        if user_id is None:
            return None
            
        user_uuid = UUID(user_id)
        user = db.query(User).filter(User.id == user_uuid).first()
        
        if user and user.is_active:
            return user
            
    except (JWTError, ValueError):
        pass
    
    return None
