"""
ProjectFile database model
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class ProjectFile(Base):
    """
    ProjectFile model for storing file metadata.
    Actual files are stored in Amazon S3.
    
    Attributes:
        id: Unique identifier (UUID)
        project_id: Foreign key to the parent project
        file_name: Original filename
        file_type: MIME type of the file
        s3_key: S3 object key for file retrieval
        file_size: Size of the file in bytes
        created_at: Upload timestamp
        
    Relationships:
        project: The project this file belongs to
    """
    __tablename__ = "project_files"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(100), nullable=True)
    s3_key = Column(String(500), nullable=False, unique=True)
    file_size = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="files")

    def __repr__(self):
        return f"<ProjectFile(id={self.id}, file_name={self.file_name})>"

    @property
    def file_extension(self) -> str:
        """
        Get the file extension from the filename.
        
        Returns:
            File extension (e.g., '.pdf', '.png')
        """
        if '.' in self.file_name:
            return '.' + self.file_name.rsplit('.', 1)[1].lower()
        return ''

    @property
    def is_image(self) -> bool:
        """
        Check if the file is an image based on MIME type.
        
        Returns:
            True if file is an image, False otherwise
        """
        if self.file_type:
            return self.file_type.startswith('image/')
        return False
