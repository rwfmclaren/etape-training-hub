from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.db.base import get_db
from app.models.user import User, UserRole
from app.models.trainer_athlete import TrainerAthleteAssignment
from app.models.training_plan import TrainingPlan
from app.models.ride import Ride
from app.models.workout import Workout
from app.models.goal import Goal
from app.schemas.user import User as UserSchema
from app.schemas.admin import UserRoleUpdate, UserLockUpdate, SystemStats
from app.schemas.trainer_athlete import (
    TrainerAssignment as TrainerAssignmentSchema,
    TrainerAssignmentCreate,
)
from app.api.deps import get_admin

router = APIRouter()


@router.get("/users", response_model=List[UserSchema])
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    role: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin),
):
    """Get all users (admin only)"""
    query = db.query(User)

    # Filter by role if specified
    if role:
        try:
            role_enum = UserRole(role)
            query = query.filter(User.role == role_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")

    users = query.offset(skip).limit(limit).all()
    return users


@router.get("/users/{user_id}", response_model=UserSchema)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin),
):
    """Get user details by ID (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{user_id}/role", response_model=UserSchema)
def change_user_role(
    user_id: int,
    role_data: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin),
):
    """Change a user's role (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Warn if admin is demoting themselves
    if user_id == current_user.id and role_data.role != UserRole.ADMIN:
        # Check if there are other admins
        other_admins = db.query(User).filter(
            User.role == UserRole.ADMIN,
            User.id != current_user.id,
            User.is_active == True,
            User.is_locked == False
        ).count()
        if other_admins == 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot demote yourself - you are the only active admin. Promote another user to admin first."
            )

    user.role = role_data.role
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}/lock", response_model=UserSchema)
def lock_unlock_user(
    user_id: int,
    lock_data: UserLockUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin),
):
    """Lock or unlock a user account (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from locking themselves
    if user_id == current_user.id and lock_data.locked:
        raise HTTPException(
            status_code=400,
            detail="Cannot lock your own account"
        )

    user.is_locked = lock_data.locked
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin),
):
    """Delete a user account (admin only) - WARNING: This is permanent"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from deleting themselves
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete your own account"
        )

    # Check if last admin
    if user.role == UserRole.ADMIN:
        other_admins = db.query(User).filter(
            User.role == UserRole.ADMIN,
            User.id != user_id,
            User.is_active == True
        ).count()
        if other_admins == 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete the last admin account"
            )

    db.delete(user)
    db.commit()
    return None


@router.get("/assignments", response_model=List[TrainerAssignmentSchema])
def get_all_assignments(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin),
):
    """Get all trainer-athlete assignments (admin only)"""
    query = db.query(TrainerAthleteAssignment)

    if active_only:
        query = query.filter(TrainerAthleteAssignment.is_active == True)

    assignments = query.offset(skip).limit(limit).all()
    return assignments


@router.post("/assignments", response_model=TrainerAssignmentSchema, status_code=status.HTTP_201_CREATED)
def create_assignment(
    assignment_data: TrainerAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin),
):
    """Manually create a trainer-athlete assignment (admin only)"""
    # Verify trainer exists and has trainer role
    trainer = db.query(User).filter(User.id == assignment_data.trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    if trainer.role not in [UserRole.TRAINER, UserRole.ADMIN]:
        raise HTTPException(status_code=400, detail="User is not a trainer")

    # Verify athlete exists
    athlete = db.query(User).filter(User.id == assignment_data.athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    # Check if assignment already exists
    existing = db.query(TrainerAthleteAssignment).filter(
        TrainerAthleteAssignment.trainer_id == assignment_data.trainer_id,
        TrainerAthleteAssignment.athlete_id == assignment_data.athlete_id,
        TrainerAthleteAssignment.is_active == True
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Active assignment already exists")

    # Create assignment
    assignment = TrainerAthleteAssignment(
        trainer_id=assignment_data.trainer_id,
        athlete_id=assignment_data.athlete_id,
        notes=assignment_data.notes,
        is_active=True
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.delete("/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin),
):
    """End a trainer-athlete assignment (admin only)"""
    assignment = db.query(TrainerAthleteAssignment).filter(
        TrainerAthleteAssignment.id == assignment_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment.is_active = False
    db.commit()
    return None


@router.get("/stats", response_model=SystemStats)
def get_system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin),
):
    """Get system-wide statistics (admin only)"""
    total_users = db.query(func.count(User.id)).scalar()
    total_athletes = db.query(func.count(User.id)).filter(User.role == UserRole.ATHLETE).scalar()
    total_trainers = db.query(func.count(User.id)).filter(User.role == UserRole.TRAINER).scalar()
    total_admins = db.query(func.count(User.id)).filter(User.role == UserRole.ADMIN).scalar()
    total_active_assignments = db.query(func.count(TrainerAthleteAssignment.id)).filter(
        TrainerAthleteAssignment.is_active == True
    ).scalar()
    total_training_plans = db.query(func.count(TrainingPlan.id)).scalar()
    total_rides = db.query(func.count(Ride.id)).scalar()
    total_workouts = db.query(func.count(Workout.id)).scalar()
    total_goals = db.query(func.count(Goal.id)).scalar()

    return SystemStats(
        total_users=total_users,
        total_athletes=total_athletes,
        total_trainers=total_trainers,
        total_admins=total_admins,
        total_active_assignments=total_active_assignments,
        total_training_plans=total_training_plans,
        total_rides=total_rides,
        total_workouts=total_workouts,
        total_goals=total_goals,
    )
