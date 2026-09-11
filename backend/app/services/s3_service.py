"""
S3 Service for file storage operations
Handles upload, download, and deletion of files in AWS S3
"""
import uuid
import logging
from typing import Optional, BinaryIO
from botocore.exceptions import ClientError
import boto3

from app.core.config import settings

logger = logging.getLogger(__name__)


class S3Service:
    """
    Service class for interacting with AWS S3.
    
    Provides methods for:
    - Uploading files to S3
    - Generating presigned URLs for downloads
    - Deleting files from S3
    """
    
    def __init__(self):
        """
        Initialize S3 client.
        
        Supports two modes:
        1. Local development: Uses AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from .env
        2. EC2 with IAM Role: Automatically uses instance credentials (no keys needed)
        """
        self.bucket_name = settings.AWS_S3_BUCKET
        self.region = settings.AWS_REGION
        
        # Check if bucket is configured
        if not self.bucket_name:
            self.s3_client = None
            self._initialized = False
            logger.warning("AWS_S3_BUCKET not configured. File uploads will fail.")
            return
        
        try:
            # If explicit credentials are provided, use them (local development)
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=self.region
                )
                logger.info("S3 client initialized with explicit credentials")
            else:
                # Use default credential chain (IAM role on EC2, ~/.aws/credentials, etc.)
                self.s3_client = boto3.client('s3', region_name=self.region)
                logger.info("S3 client initialized with default credential chain (IAM role)")
            
            self._initialized = True
        except Exception as e:
            self.s3_client = None
            self._initialized = False
            logger.error(f"Failed to initialize S3 client: {e}")
    
    @property
    def is_configured(self) -> bool:
        """Check if S3 is properly configured."""
        return self._initialized and bool(self.bucket_name)
    
    def _generate_s3_key(self, project_id: str, filename: str) -> str:
        """
        Generate a unique S3 key for a file.
        
        Args:
            project_id: The project UUID
            filename: Original filename
            
        Returns:
            S3 key in format: projects/{project_id}/{uuid}_{filename}
        """
        unique_id = str(uuid.uuid4())[:8]
        # Sanitize filename - remove potentially problematic characters
        safe_filename = "".join(c for c in filename if c.isalnum() or c in ".-_")
        return f"projects/{project_id}/{unique_id}_{safe_filename}"
    
    def upload_file(
        self,
        file_obj: BinaryIO,
        project_id: str,
        filename: str,
        content_type: Optional[str] = None
    ) -> str:
        """
        Upload a file to S3.
        
        Args:
            file_obj: File-like object to upload
            project_id: The project UUID
            filename: Original filename
            content_type: MIME type of the file
            
        Returns:
            S3 key of the uploaded file
            
        Raises:
            ValueError: If S3 is not configured
            ClientError: If upload fails
        """
        if not self.is_configured:
            raise ValueError("S3 is not configured. Please set AWS credentials.")
        
        s3_key = self._generate_s3_key(project_id, filename)
        
        extra_args = {}
        if content_type:
            extra_args['ContentType'] = content_type
        
        try:
            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket_name,
                s3_key,
                ExtraArgs=extra_args
            )
            logger.info(f"Successfully uploaded file to S3: {s3_key}")
            return s3_key
        except ClientError as e:
            logger.error(f"Failed to upload file to S3: {e}")
            raise
    
    def delete_file(self, s3_key: str) -> bool:
        """
        Delete a file from S3.
        
        Args:
            s3_key: The S3 object key
            
        Returns:
            True if deletion was successful
            
        Raises:
            ValueError: If S3 is not configured
        """
        if not self.is_configured:
            raise ValueError("S3 is not configured. Please set AWS credentials.")
        
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            logger.info(f"Successfully deleted file from S3: {s3_key}")
            return True
        except ClientError as e:
            logger.error(f"Failed to delete file from S3: {e}")
            raise
    
    def delete_project_files(self, project_id: str) -> int:
        """
        Delete all files for a project from S3.
        
        Args:
            project_id: The project UUID
            
        Returns:
            Number of files deleted
        """
        if not self.is_configured:
            raise ValueError("S3 is not configured. Please set AWS credentials.")
        
        prefix = f"projects/{project_id}/"
        deleted_count = 0
        
        try:
            # List all objects with the project prefix
            paginator = self.s3_client.get_paginator('list_objects_v2')
            pages = paginator.paginate(Bucket=self.bucket_name, Prefix=prefix)
            
            for page in pages:
                if 'Contents' in page:
                    objects_to_delete = [{'Key': obj['Key']} for obj in page['Contents']]
                    if objects_to_delete:
                        self.s3_client.delete_objects(
                            Bucket=self.bucket_name,
                            Delete={'Objects': objects_to_delete}
                        )
                        deleted_count += len(objects_to_delete)
            
            logger.info(f"Deleted {deleted_count} files for project {project_id}")
            return deleted_count
        except ClientError as e:
            logger.error(f"Failed to delete project files from S3: {e}")
            raise
    
    def get_presigned_url(
        self,
        s3_key: str,
        expiration: int = 3600,
        for_download: bool = True,
        filename: Optional[str] = None
    ) -> str:
        """
        Generate a presigned URL for accessing a file.
        
        Args:
            s3_key: The S3 object key
            expiration: URL expiration time in seconds (default: 1 hour)
            for_download: If True, sets Content-Disposition to attachment
            filename: Original filename for Content-Disposition header
            
        Returns:
            Presigned URL string
            
        Raises:
            ValueError: If S3 is not configured
        """
        if not self.is_configured:
            raise ValueError("S3 is not configured. Please set AWS credentials.")
        
        params = {
            'Bucket': self.bucket_name,
            'Key': s3_key
        }
        
        if for_download and filename:
            params['ResponseContentDisposition'] = f'attachment; filename="{filename}"'
        
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params=params,
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise
    
    def get_presigned_upload_url(
        self,
        s3_key: str,
        content_type: str,
        expiration: int = 3600
    ) -> dict:
        """
        Generate a presigned URL for direct upload from frontend.
        
        Args:
            s3_key: The S3 object key where file will be uploaded
            content_type: MIME type of the file
            expiration: URL expiration time in seconds
            
        Returns:
            Dict with 'url' and 'fields' for the upload form
        """
        if not self.is_configured:
            raise ValueError("S3 is not configured. Please set AWS credentials.")
        
        try:
            response = self.s3_client.generate_presigned_post(
                self.bucket_name,
                s3_key,
                Fields={'Content-Type': content_type},
                Conditions=[
                    {'Content-Type': content_type},
                    ['content-length-range', 1, settings.MAX_FILE_SIZE]
                ],
                ExpiresIn=expiration
            )
            return response
        except ClientError as e:
            logger.error(f"Failed to generate presigned upload URL: {e}")
            raise
    
    def file_exists(self, s3_key: str) -> bool:
        """
        Check if a file exists in S3.
        
        Args:
            s3_key: The S3 object key
            
        Returns:
            True if file exists, False otherwise
        """
        if not self.is_configured:
            return False
        
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            raise


# Singleton instance
_s3_service: Optional[S3Service] = None


def get_s3_service() -> S3Service:
    """
    Get or create the S3 service singleton.
    
    Returns:
        S3Service instance
    """
    global _s3_service
    if _s3_service is None:
        _s3_service = S3Service()
    return _s3_service
