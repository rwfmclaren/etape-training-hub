from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.base import get_db
from app.models.user import User, UserRole
from app.models.trainer_athlete import TrainerAthleteAssignment
from app.models.training_plan import (
    TrainingPlan,
    PlannedWorkout,
    PlannedGoal,
    TrainingDocument,
    NutritionPlan
)
from app.schemas.training_plan import (
    TrainingPlanCreate,
    TrainingPlanUpdate,
    TrainingPlan as TrainingPlanSchema,
    TrainingPlanSummary,
    PlannedWorkoutCreate,
    PlannedWorkoutUpdate,
    PlannedWorkout as PlannedWorkoutSchema,
    PlannedGoalCreate,
    PlannedGoalUpdate,
    PlannedGoal as PlannedGoalSchema,
    NutritionPlanCreate,
    NutritionPlanUpdate,
    NutritionPlan as NutritionPlanSchema,
    TrainingDocument as TrainingDocumentSchema,
)
from app.core.file_utils import save_upload_file, delete_file
from app.api.auth import get_current_user
from app.api.deps import get_trainer

router = APIRouter()


def verify_plan_access(plan: TrainingPlan, user: User, db: Session) -> bool:
    """Check if user has access to a training plan"""
    if user.role == UserRole.ADMIN:
        return True
    if plan.trainer_id == user.id:
        return True
    if plan.athlete_id == user.id:
        return True
    return False


def verify_plan_edit_access(plan: TrainingPlan, user: User) -> bool:
    """Check if user can edit a training plan"""
    if user.role == UserRole.ADMIN:
        return True
    if plan.trainer_id == user.id:
        return True
    return False


# Training Plan CRUD
@router.post("/", response_model=TrainingPlanSchema, status_code=status.HTTP_201_CREATED)
def create_training_plan(
    plan_data: TrainingPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_trainer),
):
    """Create a new training plan (trainers only)"""
    # Verify the athlete exists
    athlete = db.query(User).filter(User.id == plan_data.athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    # For non-admin trainers, verify they have an active assignment with the athlete
    if current_user.role != UserRole.ADMIN:
        assignment = db.query(TrainerAthleteAssignment).filter(
            TrainerAthleteAssignment.trainer_id == current_user.id,
            TrainerAthleteAssignment.athlete_id == plan_data.athlete_id,
            TrainerAthleteAssignment.is_active == True
        ).first()
        if not assignment:
            raise HTTPException(
                status_code=403,
                detail="You must have an active assignment with this athlete to create a training plan"
            )

    # Create the plan
    plan = TrainingPlan(
        **plan_data.model_dump(),
        trainer_id=current_user.id
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/", response_model=List[TrainingPlanSummary])
def get_training_plans(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get training plans (filtered by role)"""
    query = db.query(TrainingPlan)

    if current_user.role == UserRole.ADMIN:
        # Admin sees all plans
        pass
    elif current_user.role == UserRole.TRAINER:
        # Trainer sees plans they created
        query = query.filter(TrainingPlan.trainer_id == current_user.id)
    else:
        # Athlete sees plans assigned to them
        query = query.filter(TrainingPlan.athlete_id == current_user.id)

    plans = query.offset(skip).limit(limit).all()
    return plans


@router.get("/{plan_id}", response_model=TrainingPlanSchema)
def get_training_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific training plan with all details"""
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")

    if not verify_plan_access(plan, current_user, db):
        raise HTTPException(status_code=404, detail="Training plan not found")

    return plan


@router.put("/{plan_id}", response_model=TrainingPlanSchema)
def update_training_plan(
    plan_id: int,
    plan_data: TrainingPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_trainer),
):
    """Update a training plan"""
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")

    if not verify_plan_edit_access(plan, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to edit this plan")

    update_data = plan_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plan, field, value)

    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_training_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_trainer),
):
    """Delete a training plan"""
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")

    if not verify_plan_edit_access(plan, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to delete this plan")

    db.delete(plan)
    db.commit()
    return None


# Planned Workouts
@router.post("/{plan_id}/workouts", response_model=PlannedWorkoutSchema, status_code=status.HTTP_201_CREATED)
def add_workout_to_plan(
    plan_id: int,
    workout_data: PlannedWorkoutCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_trainer),
):
    """Add a workout to a training plan"""
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")

    if not verify_plan_edit_access(plan, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to edit this plan")

    workout = PlannedWorkout(**workout_data.model_dump())
    db.add(workout)
    db.commit()
    db.refresh(workout)
    return workout


@router.put("/{plan_id}/workouts/{workout_id}", response_model=PlannedWorkoutSchema)
def update_workout(
    plan_id: int,
    workout_id: int,
    workout_data: PlannedWorkoutUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a planned workout"""
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")

    # Athletes can mark workouts as completed, trainers/admins can edit all fields
    if not verify_plan_access(plan, current_user, db):
        raise HTTPException(status_code=403, detail="Not authorized")

    workout = db.query(PlannedWorkout).filter(
        PlannedWorkout.id == workout_id,
        PlannedWorkout.training_plan_id == plan_id
    ).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    # If athlete, only allow updating is_completed
    if current_user.role == UserRole.ATHLETE and plan.athlete_id == current_user.id:
        if workout_data.is_completed is not None:
            workout.is_completed = workout_data.is_completed
            if workout_data.is_completed:
                from datetime import datetime
                workout.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(workout)
        return workout

    # Trainers/admins can update all fields
    if not verify_plan_edit_access(plan, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to edit this workout")

    update_data = workout_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workout, field, value)

    db.commit()
    db.refresh(workout)
    return workout


@router.delete("/{plan_id}/workouts/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workout(
    plan_id: int,
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_trainer),
):
    """Delete a planned workout"""
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")

    if not verify_plan_edit_access(plan, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to edit this plan")

    workout = db.query(PlannedWorkout).filter(
        PlannedWorkout.id == workout_id,
        PlannedWorkout.training_plan_id == plan_id
    ).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    db.delete(workout)
    db.commit()
    return None


# Planned Goals
@router.post("/{plan_id}/goals", response_model=PlannedGoalSchema, status_code=status.HTTP_201_CREATED)
def add_goal_to_plan(
    plan_id: int,
    goal_data: PlannedGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_trainer),
):
    """Add a goal to a training plan"""
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")

    if not verify_plan_edit_access(plan, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to edit this plan")

    goal = PlannedGoal(**goal_data.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.put("/{plan_id}/goals/{goal_id}", response_model=PlannedGoalSchema)
def update_goal(
    plan_id: int,
    goal_id: int,
    goal_data: PlannedGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a planned goal"""
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")

    if not verify_plan_access(plan, current_user, db):
        raise HTTPException(status_code=403, detail="Not authorized")

    goal = db.query(PlannedGoal).filter(
        PlannedGoal.id == goal_id,
        PlannedGoal.training_plan_id == plan_id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Athletes can update current_value and is_achieved
    if current_user.role == UserRole.ATHLETE and plan.athlete_id == current_user.id:
        if goal_data.current_value is not None:
            goal.current_value = goal_data.current_value
        if goal_data.is_achieved is not None:
            goal.is_achieved = goal_data.is_achieved
        db.commit()
        db.refresh(goal)
        return goal

    # Trainers/admins can update all fields
    if not verify_plan_edit_access(plan, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to edit this goal")

    update_data = goal_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)

    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{plan_id}/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    plan_id: int,
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_trainer),
):
    """Delete a planned goal"""
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")

    if not verify_plan_edit_access(plan, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to edit this plan")

    goal = db.query(PlannedGoal).filter(
        PlannedGoal.id == goal_id,
        PlannedGoal.training_plan_id == plan_id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    db.delete(goal)
    db.commit()
    return None


# Nutrition Plans
@router.post("/{plan_id}/nutrition", response_model=NutritionPlanSchema, status_code=status.HTTP_201_CREATED)
def add_nutrition_to_plan(
    plan_id: int,
    nutrition_data: NutritionPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_trainer),
):
    """Add a nutrition plan to a training plan"""
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")

    if not verify_plan_edit_access(plan, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to edit this plan")

    nutrition = NutritionPlan(**nutrition_data.model_dump())
    db.add(nutrition)
    db.commit()
    db.refresh(nutrition)
    return nutrition


@router.put("/{plan_id}/nutrition/{nutrition_id}", response_model=NutritionPlanSchema)
def update_nutrition(
    plan_id: int,
    nutrition_id: int,
    nutrition_data: NutritionPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_trainer),
):
    """Update a nutrition plan"""
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")

    if not verify_plan_edit_access(plan, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to edit this plan")

    nutrition = db.query(NutritionPlan).filter(
        NutritionPlan.id == nutrition_id,
        NutritionPlan.training_plan_id == plan_id
    ).first()
    if not nutrition:
        raise HTTPException(status_code=404, detail="Nutrition plan not found")

    update_data = nutrition_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(nutrition, field, value)

    db.commit()
    db.refresh(nutrition)
    return nutrition


@router.delete("/{plan_id}/nutrition/{nutrition_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nutrition(
    plan_id: int,
    nutrition_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_trainer),
):
    """Delete a nutrition plan"""
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")

    if not verify_plan_edit_access(plan, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to edit this plan")

    nutrition = db.query(NutritionPlan).filter(
        NutritionPlan.id == nutrition_id,
        NutritionPlan.training_plan_id == plan_id
    ).first()
    if not nutrition:
        raise HTTPException(status_code=404, detail="Nutrition plan not found")

    db.delete(nutrition)
    db.commit()
    return None


# Training Documents
@router.post("/{plan_id}/documents", response_model=TrainingDocumentSchema, status_code=status.HTTP_201_CREATED)
async def upload_document(
    plan_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_trainer),
):
    """Upload a document to a training plan"""
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")

    if not verify_plan_edit_access(plan, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to edit this plan")

    # Save file
    file_path = save_upload_file(file, f"plan_{plan_id}")

    # Create database record
    from pathlib import Path
    document = TrainingDocument(
        training_plan_id=plan_id,
        filename=file.filename,
        file_path=file_path,
        file_type=Path(file.filename).suffix.lower(),
        description=description,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    return document


@router.get("/{plan_id}/documents/{doc_id}")
async def download_document(
    plan_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download a training plan document"""
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")

    if not verify_plan_access(plan, current_user, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this plan")

    document = db.query(TrainingDocument).filter(
        TrainingDocument.id == doc_id,
        TrainingDocument.training_plan_id == plan_id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    import os
    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")

    return FileResponse(
        path=document.file_path,
        filename=document.filename,
        media_type="application/octet-stream"
    )


@router.delete("/{plan_id}/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    plan_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_trainer),
):
    """Delete a training plan document"""
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")

    if not verify_plan_edit_access(plan, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to edit this plan")

    document = db.query(TrainingDocument).filter(
        TrainingDocument.id == doc_id,
        TrainingDocument.training_plan_id == plan_id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete file from filesystem
    delete_file(document.file_path)

    # Delete database record
    db.delete(document)
    db.commit()
    return None


# AI PDF Parsing
@router.post("/parse-pdf", status_code=status.HTTP_200_OK)
async def parse_training_plan_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_trainer),
):
    """Parse a PDF training plan using AI and return structured data for preview"""
    from app.core.claude_service import claude_service
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Read file content
    content = await file.read()
    
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
    # Parse with Claude AI
    result = await claude_service.parse_training_plan_pdf(content, file.filename)
    
    if not result["success"]:
        raise HTTPException(
            status_code=500, 
            detail=result.get("error", "Failed to parse PDF")
        )
    
    return {
        "success": True,
        "parsed_data": result["data"]
    }


@router.post("/create-from-parsed", response_model=TrainingPlanSchema, status_code=status.HTTP_201_CREATED)
def create_plan_from_parsed_data(
    athlete_id: int,
    parsed_data: dict,
    start_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_trainer),
):
    """Create a training plan from AI-parsed data"""
    from datetime import datetime, timedelta
    
    # Verify athlete
    athlete = db.query(User).filter(User.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    
    # Verify assignment for non-admins
    if current_user.role != UserRole.ADMIN:
        assignment = db.query(TrainerAthleteAssignment).filter(
            TrainerAthleteAssignment.trainer_id == current_user.id,
            TrainerAthleteAssignment.athlete_id == athlete_id,
            TrainerAthleteAssignment.is_active == True
        ).first()
        if not assignment:
            raise HTTPException(
                status_code=403,
                detail="You must have an active assignment with this athlete"
            )
    
    # Parse start date
    plan_start = datetime.strptime(start_date, "%Y-%m-%d").date() if start_date else datetime.now().date()
    
    # Calculate end date based on duration
    duration_weeks = parsed_data.get("duration_weeks", 12)
    plan_end = plan_start + timedelta(weeks=duration_weeks)
    
    # Create the training plan
    plan = TrainingPlan(
        trainer_id=current_user.id,
        athlete_id=athlete_id,
        title=parsed_data.get("title", "Training Plan"),
        description=parsed_data.get("description", ""),
        start_date=plan_start,
        end_date=plan_end,
        is_active=True
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    
    # Add workouts
    workouts = parsed_data.get("workouts", [])
    for workout_data in workouts:
        week = workout_data.get("week", 1)
        day = workout_data.get("day_of_week", 1)
        scheduled_date = plan_start + timedelta(weeks=week-1, days=day-1)
        
        workout = PlannedWorkout(
            training_plan_id=plan.id,
            title=workout_data.get("title", "Workout"),
            workout_type=workout_data.get("workout_type", "general"),
            scheduled_date=scheduled_date,
            duration_minutes=workout_data.get("duration_minutes"),
            description=workout_data.get("description", ""),
            intensity=workout_data.get("intensity", "medium"),
            exercises=str(workout_data.get("exercises", [])),
            is_completed=False
        )
        db.add(workout)
    
    # Add goals
    goals = parsed_data.get("goals", [])
    for goal_data in goals:
        goal = PlannedGoal(
            training_plan_id=plan.id,
            title=goal_data.get("title", "Goal"),
            goal_type=goal_data.get("goal_type", "performance"),
            description=goal_data.get("description", ""),
            target_value=goal_data.get("target_value"),
            unit=goal_data.get("unit"),
            target_date=plan_end,
            is_achieved=False
        )
        db.add(goal)
    
    # Add nutrition guidance as nutrition plans
    nutrition = parsed_data.get("nutrition_guidance", [])
    for idx, nutr_data in enumerate(nutrition):
        nutr_plan = NutritionPlan(
            training_plan_id=plan.id,
            day_of_week=idx % 7,
            meal_type=nutr_data.get("category", "general"),
            description=nutr_data.get("recommendation", ""),
            notes=nutr_data.get("details", "")
        )
        db.add(nutr_plan)
    
    db.commit()
    db.refresh(plan)
    return plan
