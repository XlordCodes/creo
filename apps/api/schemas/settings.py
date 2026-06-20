from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class PlatformSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sla_delivery_days: int = Field(default=3, ge=1, le=30)
    sla_revision_hours: int = Field(default=48, ge=1, le=720)
    scarcity_slots_available: int = Field(default=5, ge=0, le=100)
    updated_at: Optional[datetime] = None


class PlatformSettingsUpdate(BaseModel):
    sla_delivery_days: Optional[int] = Field(default=None, ge=1, le=30)
    sla_revision_hours: Optional[int] = Field(default=None, ge=1, le=720)
    scarcity_slots_available: Optional[int] = Field(default=None, ge=0, le=100)
