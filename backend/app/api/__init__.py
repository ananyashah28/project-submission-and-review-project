"""
API route handlers
"""
from fastapi import APIRouter

from app.api import auth, users, projects, files, tasks, bugs, milestones, timelogs, activities, project_members

router = APIRouter()

# Include authentication routes
router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Include user routes
router.include_router(users.router, prefix="/users", tags=["Users"])

# Include project routes
router.include_router(projects.router, prefix="/projects", tags=["Projects"])

# Include project members routes
router.include_router(project_members.router, tags=["Project Team Members"])

# Include task and subtask routes
router.include_router(tasks.router, tags=["Tasks & Subtasks"])

# Include bug tracker routes
router.include_router(bugs.router, tags=["Bug Tracker"])

# Include milestone routes
router.include_router(milestones.router, tags=["Milestones"])

# Include timelog routes
router.include_router(timelogs.router, tags=["Timesheets"])

# Include activity feed routes
router.include_router(activities.router, tags=["Activity Feed"])

# Include file routes
router.include_router(files.router, tags=["Files"])
