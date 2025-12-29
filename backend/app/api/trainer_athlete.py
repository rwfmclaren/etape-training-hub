from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.db.base import get_db
from app.models.user import User, UserRole
from app.models.trainer_athlete import TrainerAthleteRequest, TrainerAthleteAssignment
from app.schemas.trainer_athlete import (
    TrainerRequestCreate,
    TrainerRequestResponse,
    TrainerRequest as TrainerRequestSchema,
    TrainerAssignment as TrainerAssignmentSchema,
)
from app.schemas.user import User as UserSchema
from app.api.auth import get_current_user
from app.api.deps import get_trainer

router = APIRouter()


@router.post("/", response_model=TrainerRequestSchema, status_code=status.HTTP_201_CREATED)
def send_trainer_request(
    request_data: TrainerRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Athlete sends a request to a trainer"""
    # Verify the trainer exists and has trainer role
    trainer = db.query(User).filter(User.id == request_data.trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    if trainer.role not in [UserRole.TRAINER, UserRole.ADMIN]:
        raise HTTPException(status_code=400, detail="User is not a trainer")

    # Check if there's already a pending request
    existing_request = db.query(TrainerAthleteRequest).filter(
        TrainerAthleteRequest.athlete_id == current_user.id,
        TrainerAthleteRequest.trainer_id == request_data.trainer_id,
        TrainerAthleteRequest.status == "pending"
    ).first()
    if existing_request:
        raise HTTPException(status_code=400, detail="You already have a pending request to this trainer")

    # Check if there's already an active assignment
    existing_assignment = db.query(TrainerAthleteAssignment).filter(
        TrainerAthleteAssignment.athlete_id == current_user.id,
        TrainerAthleteAssignment.trainer_id == request_data.trainer_id,
        TrainerAthleteAssignment.is_active == True
    ).first()
    if existing_assignment:
        raise HTTPException(status_code=400, detail="You are already assigned to this trainer")

    # Create the request
    new_request = TrainerAthleteRequest(
        athlete_id=current_user.id,
        trainer_id=request_data.trainer_id,
        message=request_data.message,
        status="pending"
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request


@router.get("/", response_model=List[TrainerRequestSchema])
def get_trainer_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get trainer requests - sent requests for athletes, received requests for trainers"""
    if current_user.role in [UserRole.TRAINER, UserRole.ADMIN]:
        # Trainers see requests they received
        requests = db.query(TrainerAthleteRequest).filter(
            TrainerAthleteRequest.trainer_id == current_user.id
        ).all()
    else:
        # Athletes see requests they sent
        requests = db.query(TrainerAthleteRequest).filter(
            TrainerAthleteRequest.athlete_id == current_user.id
        ).all()
    return requests


@router.put("/{request_id}/respond", response_model=TrainerRequestSchema)
def respond_to_trainer_request(
    request_id: int,
    response_data: TrainerRequestResponse,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_trainer),
):
    """Trainer responds to a request (approve or reject)"""
    request = db.query(TrainerAthleteRequest).filter(
        TrainerAthleteRequest.id == request_id,
        TrainerAthleteRequest.trainer_id == current_user.id
    ).first()

    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if request.status != "pending":
        raise HTTPException(status_code=400, detail="Request has already been responded to")

    # Update request status
    request.status = "approved" if response_data.approve else "rejected"
    request.responded_at = datetime.utcnow()

    # If approved, create assignment
    if response_data.approve:
        assignment = TrainerAthleteAssignment(
            trainer_id=current_user.id,
            athlete_id=request.athlete_id,
            is_active=True
        )
        db.add(assignment)

    db.commit()
    db.refresh(request)
    return request


@router.get("/assignments", response_model=List[TrainerAssignmentSchema])
def get_trainer_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get active trainer-athlete assignments"""
    if current_user.role in [UserRole.TRAINER, UserRole.ADMIN]:
        # Trainers see their assigned athletes
        assignments = db.query(TrainerAthleteAssignment).filter(
            TrainerAthleteAssignment.trainer_id == current_user.id,
            TrainerAthleteAssignment.is_active == True
        ).all()
    else:
        # Athletes see their assigned trainers
        assignments = db.query(TrainerAthleteAssignment).filter(
            TrainerAthleteAssignment.athlete_id == current_user.id,
            TrainerAthleteAssignment.is_active == True
        ).all()
    return assignments


@router.delete("/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def end_trainer_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """End a trainer-athlete assignment"""
    assignment = db.query(TrainerAthleteAssignment).filter(
        TrainerAthleteAssignment.id == assignment_id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Only the trainer, athlete, or admin can end the assignment
    if current_user.role != UserRole.ADMIN and \
       current_user.id not in [assignment.trainer_id, assignment.athlete_id]:
        raise HTTPException(status_code=403, detail="Not authorized to end this assignment")

    assignment.is_active = False
    db.commit()
    return None


@router.get("/trainers/search", response_model=List[UserSchema])
def search_trainers(
    q: str = "",
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search for trainers by name or email"""
    query = db.query(User).filter(
        User.role.in_([UserRole.TRAINER, UserRole.ADMIN]),
        User.is_active == True,
        User.is_locked == False
    )

    if q:
        search_term = f"%{q}%"
        query = query.filter(
            (User.full_name.ilike(search_term)) | (User.email.ilike(search_term))
        )

    trainers = query.offset(skip).limit(limit).all()
    return trainers


@router.get("/my-athletes", response_model=List[UserSchema])
def get_my_athletes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_trainer),
):
    """Get list of athletes assigned to the current trainer"""
    # Get athlete IDs from active assignments
    athlete_ids = db.query(TrainerAthleteAssignment.athlete_id).filter(
        TrainerAthleteAssignment.trainer_id == current_user.id,
        TrainerAthleteAssignment.is_active == True
    ).all()
    athlete_ids = [aid[0] for aid in athlete_ids]

    # Get athlete user objects
    athletes = db.query(User).filter(User.id.in_(athlete_ids)).all()
    return athletes
