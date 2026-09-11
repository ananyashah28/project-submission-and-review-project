"""
Pydantic schemas for File-related requests and responses
"""
from datetime import datetime
from uuid import UUID
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict


class FileBase(BaseModel):
    """
    Base schema with shared file attributes.
    """
    file_name: str = Field(..., max_length=255, description="Original filename")
    file_type: Optional[str] = Field(None, max_length=100, description="MIME type")


class FileResponse(FileBase):
    """
    Schema for file data in API responses.
    """
    id: UUID
    project_id: UUID
    s3_key: str
    file_size: Optional[int] = None
    created_at: datetime
    download_url: Optional[str] = Field(
        None,
        description="Presigned URL for downloading the file"
    )
    is_image: bool = Field(False, description="Whether the file is an image")

    model_config = ConfigDict(from_attributes=True)


class FileUploadResponse(BaseModel):
    """
    Schema for file upload response.
    """
    id: UUID
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    download_url: Optional[str] = None
    is_image: bool = False
    message: str = "File uploaded successfully"

    model_config = ConfigDict(from_attributes=True)


class FileDeleteResponse(BaseModel):
    """
    Schema for file deletion response.
    """
    id: UUID
    file_name: str
    message: str = "File deleted successfully"


class FileListResponse(BaseModel):
    """
    Schema for listing multiple files.
    """
    files: List[FileResponse]
    total: int


class PresignedUploadResponse(BaseModel):
    """
    Schema for presigned upload URL response (for direct frontend upload).
    """
    upload_url: str
    fields: dict
    s3_key: str
    expires_in: int = 3600
