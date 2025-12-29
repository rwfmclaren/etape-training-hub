from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.base import get_db
from app.models.user import User
from app.models.goal import Goal
from app.schemas.goal import Goal as GoalSchema, GoalCreate, GoalUpdate
from app.api.auth import get_current_user
from app.api.deps import get_accessible_user_ids

router = APIRouter()


@router.get("/", response_model=List[GoalSchema])
def get_goals(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    accessible_ids = get_accessible_user_ids(current_user, db)

    query = db.query(Goal)
    if accessible_ids is not None:  # Not admin
        query = query.filter(Goal.user_id.in_(accessible_ids))

    goals = query.offset(skip).limit(limit).all()
    return goals


@router.post("/", response_model=GoalSchema)
def create_goal(
    goal_in: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = Goal(**goal_in.model_dump(), user_id=current_user.id)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.get("/{goal_id}", response_model=GoalSchema)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    accessible_ids = get_accessible_user_ids(current_user, db)

    query = db.query(Goal).filter(Goal.id == goal_id)
    if accessible_ids is not None:  # Not admin
        query = query.filter(Goal.user_id.in_(accessible_ids))

    goal = query.first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.put("/{goal_id}", response_model=GoalSchema)
def update_goal(
    goal_id: int,
    goal_in: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    update_data = goal_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)

    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted successfully"}
