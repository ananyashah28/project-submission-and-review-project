"""
Authentication API endpoints
Handles user registration, login, logout, and token refresh with httpOnly cookies
"""
from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_db, get_current_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
    hash_refresh_token,
    verify_refresh_token,
)
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.user import UserCreate, UserResponse

router = APIRouter()


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str
) -> None:
    """
    Set httpOnly cookies for access and refresh tokens.
    """
    # Access token cookie - short lived
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    
    # Refresh token cookie - longer lived
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/auth",  # Only sent to auth endpoints
    )


def clear_auth_cookies(response: Response) -> None:
    """
    Clear auth cookies on logout.
    """
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/auth")


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Register a new user and set auth cookies.
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_password,
        is_active=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(db_user.id)})
    refresh_token_str, expires_at = create_refresh_token()
    
    # Store refresh token in database
    db_refresh_token = RefreshToken(
        user_id=db_user.id,
        token=hash_refresh_token(refresh_token_str),
        expires_at=expires_at,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )
    db.add(db_refresh_token)
    db.commit()
    
    # Set cookies
    set_auth_cookies(response, access_token, refresh_token_str)
    
    return db_user


@router.post("/login")
async def login(
    response: Response,
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Authenticate user and set auth cookies.
    """
    # Find user by email
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    # Verify password
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Revoke existing refresh tokens for this user (optional: single session)
    # Uncomment to allow only one active session:
    # db.query(RefreshToken).filter(
    #     RefreshToken.user_id == user.id,
    #     RefreshToken.is_revoked == False
    # ).update({"is_revoked": True})
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token_str, expires_at = create_refresh_token()
    
    # Store refresh token in database
    db_refresh_token = RefreshToken(
        user_id=user.id,
        token=hash_refresh_token(refresh_token_str),
        expires_at=expires_at,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )
    db.add(db_refresh_token)
    db.commit()
    
    # Set cookies
    set_auth_cookies(response, access_token, refresh_token_str)
    
    return {"message": "Login successful"}


@router.post("/refresh")
async def refresh_tokens(
    response: Response,
    request: Request,
    refresh_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token from cookie.
    """
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )
    
    # Find all non-revoked, non-expired refresh tokens
    db_tokens = db.query(RefreshToken).filter(
        RefreshToken.is_revoked == False
    ).all()
    
    # Find matching token
    matching_token = None
    for db_token in db_tokens:
        if verify_refresh_token(refresh_token, db_token.token):
            matching_token = db_token
            break
    
    if not matching_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Check if token is expired
    if matching_token.is_expired:
        matching_token.is_revoked = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired"
        )
    
    # Get user
    user = db.query(User).filter(User.id == matching_token.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Revoke old refresh token (token rotation for security)
    matching_token.is_revoked = True
    
    # Create new tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token_str, expires_at = create_refresh_token()
    
    # Store new refresh token
    new_db_refresh_token = RefreshToken(
        user_id=user.id,
        token=hash_refresh_token(new_refresh_token_str),
        expires_at=expires_at,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )
    db.add(new_db_refresh_token)
    db.commit()
    
    # Set new cookies
    set_auth_cookies(response, access_token, new_refresh_token_str)
    
    return {"message": "Tokens refreshed"}


@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
):
    """
    Logout user and revoke refresh token.
    """
    # Revoke the refresh token if provided
    if refresh_token:
        db_tokens = db.query(RefreshToken).filter(
            RefreshToken.is_revoked == False
        ).all()
        
        for db_token in db_tokens:
            if verify_refresh_token(refresh_token, db_token.token):
                db_token.is_revoked = True
                db.commit()
                break
    
    # Clear cookies
    clear_auth_cookies(response)
    
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user info.
    """
    return current_user
