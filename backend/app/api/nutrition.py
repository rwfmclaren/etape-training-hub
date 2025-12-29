from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.base import get_db
from app.models.user import User
from app.models.nutrition import NutritionLog
from app.schemas.nutrition import NutritionLog as NutritionLogSchema, NutritionLogCreate, NutritionLogUpdate
from app.api.auth import get_current_user
from app.api.deps import get_accessible_user_ids

router = APIRouter()


@router.get("/", response_model=List[NutritionLogSchema])
def get_nutrition_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    accessible_ids = get_accessible_user_ids(current_user, db)

    query = db.query(NutritionLog)
    if accessible_ids is not None:  # Not admin
        query = query.filter(NutritionLog.user_id.in_(accessible_ids))

    logs = query.offset(skip).limit(limit).all()
    return logs


@router.post("/", response_model=NutritionLogSchema)
def create_nutrition_log(
    log_in: NutritionLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = NutritionLog(**log_in.model_dump(), user_id=current_user.id)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/{log_id}", response_model=NutritionLogSchema)
def get_nutrition_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    accessible_ids = get_accessible_user_ids(current_user, db)

    query = db.query(NutritionLog).filter(NutritionLog.id == log_id)
    if accessible_ids is not None:  # Not admin
        query = query.filter(NutritionLog.user_id.in_(accessible_ids))

    log = query.first()
    if not log:
        raise HTTPException(status_code=404, detail="Nutrition log not found")
    return log


@router.put("/{log_id}", response_model=NutritionLogSchema)
def update_nutrition_log(
    log_id: int,
    log_in: NutritionLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = db.query(NutritionLog).filter(NutritionLog.id == log_id, NutritionLog.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Nutrition log not found")

    update_data = log_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(log, field, value)

    db.commit()
    db.refresh(log)
    return log


@router.delete("/{log_id}")
def delete_nutrition_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = db.query(NutritionLog).filter(NutritionLog.id == log_id, NutritionLog.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Nutrition log not found")

    db.delete(log)
    db.commit()
    return {"message": "Nutrition log deleted successfully"}
