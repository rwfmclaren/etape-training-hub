from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any


class IntegrationStatus(BaseModel):
    provider: str
    connected: bool
    connected_at: Optional[datetime] = None
    last_sync: Optional[datetime] = None
    athlete_id: Optional[str] = None


class IntegrationConnect(BaseModel):
    auth_url: str


class ActivityBase(BaseModel):
    activity_type: str
    name: str
    activity_date: datetime
    duration_minutes: Optional[float] = None
    distance_km: Optional[float] = None
    elevation_m: Optional[float] = None
    calories: Optional[int] = None
    heart_rate_avg: Optional[int] = None
    heart_rate_max: Optional[int] = None
    power_avg: Optional[int] = None
    power_max: Optional[int] = None
    cadence_avg: Optional[int] = None
    speed_avg_kmh: Optional[float] = None
    speed_max_kmh: Optional[float] = None


class ActivityCreate(ActivityBase):
    source: str = "manual"
    external_id: Optional[str] = None
    data_json: Optional[Any] = None


class ActivityInDB(ActivityBase):
    id: int
    user_id: int
    source: str
    external_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SyncResult(BaseModel):
    success: bool
    activities_synced: int
    message: str
