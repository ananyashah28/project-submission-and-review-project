"""
RefreshToken database model
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class RefreshToken(Base):
    """
    RefreshToken model for storing refresh tokens.
    
    Attributes:
        id: Unique identifier (UUID)
        user_id: Foreign key to the user
        token: The actual refresh token string (hashed)
        expires_at: When the token expires
        is_revoked: Whether the token has been revoked
        created_at: Token creation timestamp
        user_agent: Browser/client user agent for tracking
        ip_address: Client IP address for security tracking
        
    Relationships:
        user: The user who owns this token
    """
    __tablename__ = "refresh_tokens"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    token = Column(String(500), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(50), nullable=True)

    # Relationships
    user = relationship("User", back_populates="refresh_tokens")

    def __repr__(self):
        return f"<RefreshToken(id={self.id}, user_id={self.user_id}, revoked={self.is_revoked})>"

    @property
    def is_expired(self) -> bool:
        """Check if the token has expired."""
        return datetime.utcnow() > self.expires_at

    @property
    def is_valid(self) -> bool:
        """Check if the token is valid (not expired and not revoked)."""
        return not self.is_expired and not self.is_revoked
