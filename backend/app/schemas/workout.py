from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class WorkoutBase(BaseModel):
    title: str
    description: Optional[str] = None
    workout_type: str
    duration_minutes: int
    intensity: Optional[str] = None
    notes: Optional[str] = None
    workout_date: datetime


class WorkoutCreate(WorkoutBase):
    pass


class WorkoutUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    workout_type: Optional[str] = None
    duration_minutes: Optional[int] = None
    intensity: Optional[str] = None
    notes: Optional[str] = None
    workout_date: Optional[datetime] = None


class Workout(WorkoutBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
