from typing import List, Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.models.user import User, UserRole
from app.models.trainer_athlete import TrainerAthleteAssignment
from app.api.auth import get_current_user


def require_role(allowed_roles: List[UserRole]):
    """
    Dependency factory to check if user has required role.

    Usage:
        @router.get("/some-endpoint")
        def endpoint(user: User = Depends(require_role([UserRole.ADMIN, UserRole.TRAINER]))):
            ...
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        if current_user.is_locked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is locked"
            )
        return current_user
    return role_checker


def get_trainer(current_user: User = Depends(get_current_user)) -> User:
    """Ensure current user is a trainer or admin"""
    if current_user.role not in [UserRole.TRAINER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers can access this resource"
        )
    if current_user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is locked"
        )
    return current_user


def get_admin(current_user: User = Depends(get_current_user)) -> User:
    """Ensure current user is an admin"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    if current_user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is locked"
        )
    return current_user


def get_accessible_user_ids(current_user: User, db: Session) -> Optional[List[int]]:
    """
    Get list of user IDs that current user can access data for.

    Returns:
        - None: For admins (signal to not filter by user_id)
        - List[int]: List of accessible user IDs for trainers and athletes
    """
    if current_user.role == UserRole.ADMIN:
        # Admin sees everyone - return None to signal no filtering
        return None
    elif current_user.role == UserRole.TRAINER:
        # Trainer sees self + assigned athletes
        assigned_athletes = db.query(TrainerAthleteAssignment.athlete_id).filter(
            TrainerAthleteAssignment.trainer_id == current_user.id,
            TrainerAthleteAssignment.is_active == True
        ).all()
        athlete_ids = [a[0] for a in assigned_athletes]
        return [current_user.id] + athlete_ids
    else:
        # Athlete sees only self
        return [current_user.id]
