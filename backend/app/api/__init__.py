"""
API route handlers
"""
from fastapi import APIRouter

from app.api import auth, users, projects, files

router = APIRouter()

# Include authentication routes
router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Include user routes
router.include_router(users.router, prefix="/users", tags=["Users"])

# Include project routes
router.include_router(projects.router, prefix="/projects", tags=["Projects"])

# Include file routes
router.include_router(files.router, tags=["Files"])
