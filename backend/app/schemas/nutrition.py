from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class NutritionLogBase(BaseModel):
    meal_type: Optional[str] = None
    calories: Optional[int] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    water_ml: Optional[int] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    log_date: datetime


class NutritionLogCreate(NutritionLogBase):
    pass


class NutritionLogUpdate(BaseModel):
    meal_type: Optional[str] = None
    calories: Optional[int] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    water_ml: Optional[int] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    log_date: Optional[datetime] = None


class NutritionLog(NutritionLogBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
