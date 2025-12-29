from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    goal_type: str
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    unit: Optional[str] = None
    target_date: Optional[datetime] = None


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    goal_type: Optional[str] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    unit: Optional[str] = None
    target_date: Optional[datetime] = None
    is_completed: Optional[bool] = None


class Goal(GoalBase):
    id: int
    user_id: int
    is_completed: bool
    completed_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
