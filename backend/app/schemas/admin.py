from pydantic import BaseModel
from typing import Optional
from app.models.user import UserRole


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserLockUpdate(BaseModel):
    locked: bool


class SystemStats(BaseModel):
    total_users: int
    total_athletes: int
    total_trainers: int
    total_admins: int
    total_active_assignments: int
    total_training_plans: int
    total_rides: int
    total_workouts: int
    total_goals: int
