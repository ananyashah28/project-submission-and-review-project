"""
User database model
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    """
    User model for storing user account information.
    
    Attributes:
        id: Unique identifier (UUID)
        name: User's display name
        email: User's email address (unique)
        password_hash: Hashed password
        is_active: Whether the user account is active
        created_at: Account creation timestamp
        
    Relationships:
        projects: List of projects owned by the user
    """
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    projects = relationship(
        "Project",
        back_populates="owner",
        cascade="all, delete-orphan"
    )
    refresh_tokens = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
