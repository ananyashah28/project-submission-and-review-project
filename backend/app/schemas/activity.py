"""
Pydantic schemas for Activity Feed & Audit Trail
"""
from datetime import datetime
from uuid import UUID
from typing import Optional, List

from pydantic import BaseModel, ConfigDict


class ActivityLogResponse(BaseModel):
    id: UUID
    project_id: UUID
    action: str
    entity_type: str
    entity_id: Optional[UUID] = None
    details: str
    user_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActivityLogListResponse(BaseModel):
    total: int
    activities: List[ActivityLogResponse]
