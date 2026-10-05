"""
FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="A centralized platform for project submission and review",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS - Must have explicit origins for credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,  # Cannot use ["*"] with credentials
    allow_credentials=True,  # Required for cookies
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["Set-Cookie"],
)


# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    """
    Health check endpoint to verify the API is running.
    """
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "allowed_origins": settings.ALLOWED_ORIGINS,
    }


# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """
    Root endpoint with API information.
    """
    return {
        "message": "Welcome to the Project Submission Portal API",
        "docs": "/docs",
        "health": "/health",
    }


# Startup database initialization
@app.on_event("startup")
def startup_db_init():
    """
    Ensure all models and tables exist on application startup.
    This guarantees that newly added features (tasks, bugs, milestones, timelogs, members)
    never crash with relation does not exist in production.
    """
    try:
        from app.core.database import engine, Base
        import app.models  # ensure all models are registered
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        import logging
        logging.getLogger("uvicorn.error").warning(f"Database auto-creation warning: {e}")


# Include API routers
from app.api import router as api_router
app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
