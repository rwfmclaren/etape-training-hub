from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TrainerRequestCreate(BaseModel):
    trainer_id: int
    message: Optional[str] = None


class TrainerRequestResponse(BaseModel):
    approve: bool


class TrainerRequest(BaseModel):
    id: int
    athlete_id: int
    trainer_id: int
    status: str  # pending, approved, rejected
    message: Optional[str] = None
    created_at: datetime
    responded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TrainerAssignment(BaseModel):
    id: int
    trainer_id: int
    athlete_id: int
    assigned_at: datetime
    is_active: bool
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class TrainerAssignmentCreate(BaseModel):
    trainer_id: int
    athlete_id: int
    notes: Optional[str] = None
