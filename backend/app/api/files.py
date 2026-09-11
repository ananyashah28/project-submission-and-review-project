"""
File Management API endpoints
Handles file upload, download, listing, and deletion with S3 integration
"""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.project import Project
from app.models.file import ProjectFile
from app.schemas.file import (
    FileResponse,
    FileUploadResponse,
    FileDeleteResponse,
    FileListResponse,
)
from app.services.s3_service import get_s3_service

router = APIRouter()


def get_project_with_ownership(
    project_id: UUID,
    user: User,
    db: Session
) -> Project:
    """
    Get project and verify ownership.
    
    Args:
        project_id: The project UUID
        user: Current authenticated user
        db: Database session
        
    Returns:
        Project if found and owned by user
        
    Raises:
        HTTPException: If project not found or not owned by user
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    if project.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project"
        )
    
    return project


@router.post(
    "/projects/{project_id}/files",
    response_model=FileUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a file to a project"
)
async def upload_file(
    project_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a file to a project.
    
    - Validates file type and size
    - Uploads to S3
    - Creates database record
    
    **Allowed file types:** images (png, jpeg, gif), PDF, ZIP, Word, PowerPoint
    
    **Max file size:** 50 MB
    """
    # Verify project ownership
    project = get_project_with_ownership(project_id, current_user, db)
    
    # Validate file type
    if file.content_type not in settings.ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' is not allowed. Allowed types: images, PDF, ZIP, Word, PowerPoint"
        )
    
    # Read file content to check size
    content = await file.read()
    file_size = len(content)
    
    if file_size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size ({file_size / 1024 / 1024:.2f} MB) exceeds maximum allowed size ({settings.MAX_FILE_SIZE / 1024 / 1024:.0f} MB)"
        )
    
    # Reset file position for upload
    await file.seek(0)
    
    # Get S3 service
    s3_service = get_s3_service()
    
    if not s3_service.is_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="File storage service is not configured"
        )
    
    try:
        # Upload to S3
        s3_key = s3_service.upload_file(
            file_obj=file.file,
            project_id=str(project_id),
            filename=file.filename,
            content_type=file.content_type
        )
        
        # Create database record
        db_file = ProjectFile(
            project_id=project_id,
            file_name=file.filename,
            file_type=file.content_type,
            s3_key=s3_key,
            file_size=file_size
        )
        
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        # Generate download URL
        download_url = s3_service.get_presigned_url(
            s3_key=s3_key,
            filename=file.filename
        )
        
        return FileUploadResponse(
            id=db_file.id,
            file_name=db_file.file_name,
            file_type=db_file.file_type,
            file_size=db_file.file_size,
            download_url=download_url,
            is_image=db_file.is_image,
            message="File uploaded successfully"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )


@router.get(
    "/projects/{project_id}/files",
    response_model=FileListResponse,
    summary="List all files for a project"
)
async def list_project_files(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all files for a project with download URLs.
    """
    # Verify project ownership
    project = get_project_with_ownership(project_id, current_user, db)
    
    # Get files from database
    files = db.query(ProjectFile).filter(
        ProjectFile.project_id == project_id
    ).order_by(ProjectFile.created_at.desc()).all()
    
    s3_service = get_s3_service()
    
    # Build response with download URLs
    file_responses = []
    for file in files:
        download_url = None
        if s3_service.is_configured:
            try:
                download_url = s3_service.get_presigned_url(
                    s3_key=file.s3_key,
                    filename=file.file_name
                )
            except Exception:
                pass  # URL generation failed, leave as None
        
        file_responses.append(FileResponse(
            id=file.id,
            project_id=file.project_id,
            file_name=file.file_name,
            file_type=file.file_type,
            s3_key=file.s3_key,
            file_size=file.file_size,
            created_at=file.created_at,
            download_url=download_url,
            is_image=file.is_image
        ))
    
    return FileListResponse(
        files=file_responses,
        total=len(file_responses)
    )


@router.get(
    "/files/{file_id}",
    response_model=FileResponse,
    summary="Get file details"
)
async def get_file(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get details for a specific file including download URL.
    """
    # Get file
    file = db.query(ProjectFile).filter(ProjectFile.id == file_id).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Verify project ownership
    get_project_with_ownership(file.project_id, current_user, db)
    
    # Generate download URL
    s3_service = get_s3_service()
    download_url = None
    
    if s3_service.is_configured:
        try:
            download_url = s3_service.get_presigned_url(
                s3_key=file.s3_key,
                filename=file.file_name
            )
        except Exception:
            pass
    
    return FileResponse(
        id=file.id,
        project_id=file.project_id,
        file_name=file.file_name,
        file_type=file.file_type,
        s3_key=file.s3_key,
        file_size=file.file_size,
        created_at=file.created_at,
        download_url=download_url,
        is_image=file.is_image
    )


@router.get(
    "/files/{file_id}/download",
    summary="Get download URL for a file"
)
async def get_download_url(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a presigned download URL for a file.
    Returns a redirect URL or the URL in JSON format.
    """
    # Get file
    file = db.query(ProjectFile).filter(ProjectFile.id == file_id).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Verify project ownership
    get_project_with_ownership(file.project_id, current_user, db)
    
    s3_service = get_s3_service()
    
    if not s3_service.is_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="File storage service is not configured"
        )
    
    try:
        download_url = s3_service.get_presigned_url(
            s3_key=file.s3_key,
            filename=file.file_name,
            for_download=True
        )
        return {"download_url": download_url, "file_name": file.file_name}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate download URL: {str(e)}"
        )


@router.delete(
    "/files/{file_id}",
    response_model=FileDeleteResponse,
    summary="Delete a file"
)
async def delete_file(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a file from S3 and database.
    """
    # Get file
    file = db.query(ProjectFile).filter(ProjectFile.id == file_id).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Verify project ownership
    get_project_with_ownership(file.project_id, current_user, db)
    
    file_name = file.file_name
    s3_key = file.s3_key
    
    # Delete from S3
    s3_service = get_s3_service()
    
    if s3_service.is_configured:
        try:
            s3_service.delete_file(s3_key)
        except Exception as e:
            # Log error but continue with database deletion
            print(f"Warning: Failed to delete file from S3: {e}")
    
    # Delete from database
    db.delete(file)
    db.commit()
    
    return FileDeleteResponse(
        id=file_id,
        file_name=file_name,
        message="File deleted successfully"
    )
