"""
Pydantic schemas for User-related requests and responses
"""
from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    """
    Base schema with shared user attributes.
    """
    name: str = Field(..., min_length=1, max_length=100, description="User's display name")
    email: EmailStr = Field(..., description="User's email address")


class UserCreate(UserBase):
    """
    Schema for creating a new user (registration).
    """
    password: str = Field(
        ...,
        min_length=8,
        max_length=100,
        description="User's password (min 8 characters)"
    )


class UserLogin(BaseModel):
    """
    Schema for user login request.
    """
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")


class UserUpdate(BaseModel):
    """
    Schema for updating user information.
    """
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None


class UserResponse(UserBase):
    """
    Schema for user data in API responses.
    Excludes sensitive information like password.
    """
    id: UUID
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserInDB(UserResponse):
    """
    Schema representing user as stored in database.
    Includes password hash (for internal use only).
    """
    password_hash: str

    model_config = ConfigDict(from_attributes=True)
