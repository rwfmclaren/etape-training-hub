from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class TrainingPlan(Base):
    __tablename__ = "training_plans"

    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    athlete_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    trainer = relationship("User", foreign_keys=[trainer_id])
    athlete = relationship("User", foreign_keys=[athlete_id])
    workouts = relationship("PlannedWorkout", back_populates="training_plan", cascade="all, delete-orphan")
    goals = relationship("PlannedGoal", back_populates="training_plan", cascade="all, delete-orphan")
    documents = relationship("TrainingDocument", back_populates="training_plan", cascade="all, delete-orphan")
    nutrition_plans = relationship("NutritionPlan", back_populates="training_plan", cascade="all, delete-orphan")


class PlannedWorkout(Base):
    __tablename__ = "planned_workouts"

    id = Column(Integer, primary_key=True, index=True)
    training_plan_id = Column(Integer, ForeignKey("training_plans.id"), nullable=False)
    title = Column(String, nullable=False)
    workout_type = Column(String, nullable=False)
    scheduled_date = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer)
    description = Column(Text)
    intensity = Column(String)  # low, medium, high
    exercises = Column(Text)  # JSON string of exercises array
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)

    training_plan = relationship("TrainingPlan", back_populates="workouts")


class PlannedGoal(Base):
    __tablename__ = "planned_goals"

    id = Column(Integer, primary_key=True, index=True)
    training_plan_id = Column(Integer, ForeignKey("training_plans.id"), nullable=False)
    title = Column(String, nullable=False)
    goal_type = Column(String, nullable=False)
    description = Column(Text)
    target_value = Column(Float)
    current_value = Column(Float)
    unit = Column(String)
    target_date = Column(DateTime)
    is_achieved = Column(Boolean, default=False)

    training_plan = relationship("TrainingPlan", back_populates="goals")


class TrainingDocument(Base):
    __tablename__ = "training_documents"

    id = Column(Integer, primary_key=True, index=True)
    training_plan_id = Column(Integer, ForeignKey("training_plans.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)  # Path to uploaded file
    file_type = Column(String)  # pdf, txt, etc
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    description = Column(Text)

    training_plan = relationship("TrainingPlan", back_populates="documents")


class NutritionPlan(Base):
    __tablename__ = "nutrition_plans"

    id = Column(Integer, primary_key=True, index=True)
    training_plan_id = Column(Integer, ForeignKey("training_plans.id"), nullable=False)
    day_of_week = Column(String)  # monday, tuesday, etc (optional for specific days)
    meal_type = Column(String)  # breakfast, lunch, dinner, snack
    description = Column(Text)
    calories = Column(Float)
    protein_grams = Column(Float)
    carbs_grams = Column(Float)
    fat_grams = Column(Float)
    notes = Column(Text)

    training_plan = relationship("TrainingPlan", back_populates="nutrition_plans")
