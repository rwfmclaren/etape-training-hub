from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


# PlannedWorkout Schemas
class PlannedWorkoutBase(BaseModel):
    title: str
    workout_type: str
    scheduled_date: datetime
    duration_minutes: Optional[int] = None
    description: Optional[str] = None
    intensity: Optional[str] = None
    exercises: Optional[str] = None  # JSON string


class PlannedWorkoutCreate(PlannedWorkoutBase):
    training_plan_id: int


class PlannedWorkoutUpdate(BaseModel):
    title: Optional[str] = None
    workout_type: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    description: Optional[str] = None
    intensity: Optional[str] = None
    exercises: Optional[str] = None
    is_completed: Optional[bool] = None


class PlannedWorkout(PlannedWorkoutBase):
    id: int
    training_plan_id: int
    is_completed: bool
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# PlannedGoal Schemas
class PlannedGoalBase(BaseModel):
    title: str
    goal_type: str
    description: Optional[str] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    unit: Optional[str] = None
    target_date: Optional[datetime] = None


class PlannedGoalCreate(PlannedGoalBase):
    training_plan_id: int


class PlannedGoalUpdate(BaseModel):
    title: Optional[str] = None
    goal_type: Optional[str] = None
    description: Optional[str] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    unit: Optional[str] = None
    target_date: Optional[datetime] = None
    is_achieved: Optional[bool] = None


class PlannedGoal(PlannedGoalBase):
    id: int
    training_plan_id: int
    is_achieved: bool

    class Config:
        from_attributes = True


# TrainingDocument Schemas
class TrainingDocumentBase(BaseModel):
    filename: str
    description: Optional[str] = None


class TrainingDocumentCreate(TrainingDocumentBase):
    training_plan_id: int
    file_path: str
    file_type: str


class TrainingDocument(TrainingDocumentBase):
    id: int
    training_plan_id: int
    file_path: str
    file_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


# NutritionPlan Schemas
class NutritionPlanBase(BaseModel):
    day_of_week: Optional[str] = None
    meal_type: str
    description: Optional[str] = None
    calories: Optional[float] = None
    protein_grams: Optional[float] = None
    carbs_grams: Optional[float] = None
    fat_grams: Optional[float] = None
    notes: Optional[str] = None


class NutritionPlanCreate(NutritionPlanBase):
    training_plan_id: int


class NutritionPlanUpdate(BaseModel):
    day_of_week: Optional[str] = None
    meal_type: Optional[str] = None
    description: Optional[str] = None
    calories: Optional[float] = None
    protein_grams: Optional[float] = None
    carbs_grams: Optional[float] = None
    fat_grams: Optional[float] = None
    notes: Optional[str] = None


class NutritionPlan(NutritionPlanBase):
    id: int
    training_plan_id: int

    class Config:
        from_attributes = True


# TrainingPlan Schemas
class TrainingPlanBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class TrainingPlanCreate(TrainingPlanBase):
    athlete_id: int


class TrainingPlanUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None


class TrainingPlan(TrainingPlanBase):
    id: int
    trainer_id: int
    athlete_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    workouts: List[PlannedWorkout] = []
    goals: List[PlannedGoal] = []
    documents: List[TrainingDocument] = []
    nutrition_plans: List[NutritionPlan] = []

    class Config:
        from_attributes = True


class TrainingPlanSummary(TrainingPlanBase):
    """Lightweight version without nested relationships"""
    id: int
    trainer_id: int
    athlete_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
