"""
Security utilities for authentication and password hashing
"""
import secrets
import hashlib
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Tuple

from jose import JWTError, jwt

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    
    Args:
        plain_password: The plain text password to verify
        hashed_password: The hashed password to compare against
        
    Returns:
        True if passwords match, False otherwise
    """
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def get_password_hash(password: str) -> str:
    """
    Hash a plain password.
    
    Args:
        password: The plain text password to hash
        
    Returns:
        The hashed password
    """
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: The data to encode in the token (typically {"sub": user_id})
        expires_delta: Optional custom expiration time
        
    Returns:
        The encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt


def create_refresh_token() -> Tuple[str, datetime]:
    """
    Create a secure random refresh token.
    
    Returns:
        Tuple of (token string, expiration datetime)
    """
    token = secrets.token_urlsafe(32)  # Shorter token (32 bytes = 43 chars when base64 encoded)
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return token, expires_at


def hash_refresh_token(token: str) -> str:
    """
    Hash a refresh token for secure storage using SHA256.
    We use SHA256 instead of bcrypt because refresh tokens are already
    cryptographically random, so we just need a one-way hash for storage.
    
    Args:
        token: The plain refresh token
        
    Returns:
        Hashed token (SHA256 hex digest)
    """
    return hashlib.sha256(token.encode('utf-8')).hexdigest()


def verify_refresh_token(plain_token: str, hashed_token: str) -> bool:
    """
    Verify a refresh token against its hash.
    
    Args:
        plain_token: The plain refresh token
        hashed_token: The hashed token from database
        
    Returns:
        True if tokens match
    """
    return hash_refresh_token(plain_token) == hashed_token


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and verify a JWT access token.
    
    Args:
        token: The JWT token to decode
        
    Returns:
        The decoded token payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None
