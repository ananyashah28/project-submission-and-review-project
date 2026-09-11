"""
Pydantic schemas for authentication tokens
"""
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class Token(BaseModel):
    """
    Schema for JWT token response.
    """
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")


class TokenData(BaseModel):
    """
    Schema for data extracted from JWT token.
    Used internally for authentication.
    """
    user_id: Optional[UUID] = Field(None, description="User ID from token")
    email: Optional[str] = Field(None, description="User email from token")


class TokenPayload(BaseModel):
    """
    Schema for JWT token payload.
    """
    sub: str = Field(..., description="Subject (user ID)")
    exp: int = Field(..., description="Expiration timestamp")
