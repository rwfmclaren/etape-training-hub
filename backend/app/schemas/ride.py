from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class RideBase(BaseModel):
    title: str
    description: Optional[str] = None
    distance_km: float
    duration_minutes: int
    elevation_gain_m: Optional[float] = None
    avg_speed_kmh: Optional[float] = None
    max_speed_kmh: Optional[float] = None
    avg_power_watts: Optional[int] = None
    avg_heart_rate: Optional[int] = None
    max_heart_rate: Optional[int] = None
    avg_cadence: Optional[int] = None
    ride_date: datetime
    route_name: Optional[str] = None
    ride_type: Optional[str] = None


class RideCreate(RideBase):
    pass


class RideUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    distance_km: Optional[float] = None
    duration_minutes: Optional[int] = None
    elevation_gain_m: Optional[float] = None
    avg_speed_kmh: Optional[float] = None
    max_speed_kmh: Optional[float] = None
    avg_power_watts: Optional[int] = None
    avg_heart_rate: Optional[int] = None
    max_heart_rate: Optional[int] = None
    avg_cadence: Optional[int] = None
    ride_date: Optional[datetime] = None
    route_name: Optional[str] = None
    ride_type: Optional[str] = None


class Ride(RideBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
