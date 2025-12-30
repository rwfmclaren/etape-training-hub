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


@router.get("/athletes/{athlete_id}/stats")
def get_athlete_stats(
    athlete_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_trainer),
):
    """Get detailed stats for an athlete (trainers only)"""
    from app.models.ride import Ride
    from app.models.workout import Workout
    from app.models.goal import Goal
    from app.models.training_plan import TrainingPlan, PlannedWorkout
    from datetime import timedelta
    from sqlalchemy import func
    
    # Verify assignment
    if current_user.role != UserRole.ADMIN:
        assignment = db.query(TrainerAthleteAssignment).filter(
            TrainerAthleteAssignment.trainer_id == current_user.id,
            TrainerAthleteAssignment.athlete_id == athlete_id,
            TrainerAthleteAssignment.is_active == True
        ).first()
        if not assignment:
            raise HTTPException(status_code=403, detail="Not authorized to view this athlete")
    
    # Get athlete info
    athlete = db.query(User).filter(User.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    
    # Rides stats
    total_rides = db.query(Ride).filter(Ride.user_id == athlete_id).count()
    recent_rides = db.query(Ride).filter(
        Ride.user_id == athlete_id,
        Ride.ride_date >= week_ago
    ).count()
    total_distance = db.query(func.sum(Ride.distance_km)).filter(
        Ride.user_id == athlete_id
    ).scalar() or 0
    
    # Workouts stats
    total_workouts = db.query(Workout).filter(Workout.user_id == athlete_id).count()
    recent_workouts = db.query(Workout).filter(
        Workout.user_id == athlete_id,
        Workout.workout_date >= week_ago
    ).count()
    
    # Goals stats
    total_goals = db.query(Goal).filter(Goal.user_id == athlete_id).count()
    completed_goals = db.query(Goal).filter(
        Goal.user_id == athlete_id,
        Goal.is_completed == True
    ).count()
    
    # Training plan compliance
    active_plans = db.query(TrainingPlan).filter(
        TrainingPlan.athlete_id == athlete_id,
        TrainingPlan.is_active == True
    ).all()
    
    total_planned = 0
    completed_planned = 0
    for plan in active_plans:
        workouts = db.query(PlannedWorkout).filter(
            PlannedWorkout.training_plan_id == plan.id,
            PlannedWorkout.scheduled_date <= now
        ).all()
        total_planned += len(workouts)
        completed_planned += sum(1 for w in workouts if w.is_completed)
    
    compliance_rate = (completed_planned / total_planned * 100) if total_planned > 0 else 0
    
    # Last activity
    last_ride = db.query(Ride).filter(Ride.user_id == athlete_id).order_by(Ride.ride_date.desc()).first()
    last_workout = db.query(Workout).filter(Workout.user_id == athlete_id).order_by(Workout.workout_date.desc()).first()
    
    last_activity = None
    if last_ride and last_workout:
        last_activity = max(last_ride.ride_date, last_workout.workout_date).isoformat()
    elif last_ride:
        last_activity = last_ride.ride_date.isoformat()
    elif last_workout:
        last_activity = last_workout.workout_date.isoformat()
    
    return {
        "athlete": {
            "id": athlete.id,
            "email": athlete.email,
            "full_name": athlete.full_name,
            "created_at": athlete.created_at.isoformat() if athlete.created_at else None
        },
        "rides": {
            "total": total_rides,
            "this_week": recent_rides,
            "total_distance_km": round(total_distance, 1)
        },
        "workouts": {
            "total": total_workouts,
            "this_week": recent_workouts
        },
        "goals": {
            "total": total_goals,
            "completed": completed_goals
        },
        "training_plans": {
            "active_count": len(active_plans),
            "compliance_rate": round(compliance_rate, 1),
            "planned_workouts": total_planned,
            "completed_workouts": completed_planned
        },
        "last_activity": last_activity
    }

@router.get("/athletes/{athlete_id}/activity")
def get_athlete_activity(
    athlete_id: int,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_trainer),
):
    """Get recent activity feed for an athlete"""
    from app.models.ride import Ride
    from app.models.workout import Workout
    
    if current_user.role != UserRole.ADMIN:
        assignment = db.query(TrainerAthleteAssignment).filter(
            TrainerAthleteAssignment.trainer_id == current_user.id,
            TrainerAthleteAssignment.athlete_id == athlete_id,
            TrainerAthleteAssignment.is_active == True
        ).first()
        if not assignment:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    rides = db.query(Ride).filter(Ride.user_id == athlete_id).order_by(Ride.ride_date.desc()).limit(limit).all()
    workouts = db.query(Workout).filter(Workout.user_id == athlete_id).order_by(Workout.workout_date.desc()).limit(limit).all()
    
    activity = []
    for ride in rides:
        activity.append({
            "type": "ride",
            "id": ride.id,
            "title": ride.title,
            "date": ride.ride_date.isoformat() if ride.ride_date else None,
            "details": {"distance_km": ride.distance_km, "duration_minutes": ride.duration_minutes}
        })
    for workout in workouts:
        activity.append({
            "type": "workout",
            "id": workout.id,
            "title": workout.title,
            "date": workout.workout_date.isoformat() if workout.workout_date else None,
            "details": {"workout_type": workout.workout_type, "duration_minutes": workout.duration_minutes}
        })
    
    activity.sort(key=lambda x: x["date"] or "", reverse=True)
    return activity[:limit]


@router.get("/athletes/{athlete_id}/plans")
def get_athlete_training_plans(
    athlete_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_trainer),
):
    """Get training plans for an athlete"""
    from app.models.training_plan import TrainingPlan
    
    if current_user.role != UserRole.ADMIN:
        assignment = db.query(TrainerAthleteAssignment).filter(
            TrainerAthleteAssignment.trainer_id == current_user.id,
            TrainerAthleteAssignment.athlete_id == athlete_id,
            TrainerAthleteAssignment.is_active == True
        ).first()
        if not assignment:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    plans = db.query(TrainingPlan).filter(TrainingPlan.athlete_id == athlete_id).order_by(TrainingPlan.created_at.desc()).all()
    return [{
        "id": p.id, "title": p.title, "description": p.description,
        "start_date": p.start_date.isoformat() if p.start_date else None,
        "end_date": p.end_date.isoformat() if p.end_date else None,
        "is_active": p.is_active
    } for p in plans]


@router.get("/dashboard-stats")
def get_trainer_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_trainer),
):
    """Get summary stats for trainer dashboard"""
    from app.models.training_plan import TrainingPlan, PlannedWorkout
    from app.models.ride import Ride
    from app.models.workout import Workout
    from datetime import timedelta
    
    athlete_ids = [a[0] for a in db.query(TrainerAthleteAssignment.athlete_id).filter(
        TrainerAthleteAssignment.trainer_id == current_user.id,
        TrainerAthleteAssignment.is_active == True
    ).all()]
    
    active_plans = db.query(TrainingPlan).filter(
        TrainingPlan.trainer_id == current_user.id, TrainingPlan.is_active == True
    ).count()
    
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    
    attention_list = []
    athlete_summaries = []
    
    for aid in athlete_ids:
        athlete = db.query(User).filter(User.id == aid).first()
        if not athlete: continue
        
        last_ride = db.query(Ride).filter(Ride.user_id == aid).order_by(Ride.ride_date.desc()).first()
        last_workout = db.query(Workout).filter(Workout.user_id == aid).order_by(Workout.workout_date.desc()).first()
        
        last_activity = None
        if last_ride and last_workout:
            last_activity = max(last_ride.ride_date, last_workout.workout_date)
        elif last_ride: last_activity = last_ride.ride_date
        elif last_workout: last_activity = last_workout.workout_date
        
        if not last_activity or last_activity < week_ago:
            attention_list.append({"id": athlete.id, "full_name": athlete.full_name, "email": athlete.email})
        
        plans = db.query(TrainingPlan).filter(TrainingPlan.athlete_id == aid, TrainingPlan.is_active == True).all()
        total_w, completed_w = 0, 0
        for p in plans:
            ws = db.query(PlannedWorkout).filter(PlannedWorkout.training_plan_id == p.id, PlannedWorkout.scheduled_date <= now).all()
            total_w += len(ws)
            completed_w += sum(1 for w in ws if w.is_completed)
        
        compliance = (completed_w / total_w * 100) if total_w > 0 else 0
        athlete_summaries.append({
            "id": athlete.id, "full_name": athlete.full_name, "email": athlete.email,
            "compliance_rate": round(compliance, 1),
            "last_activity": last_activity.isoformat() if last_activity else None,
            "active_plans": len(plans)
        })
    
    return {
        "total_athletes": len(athlete_ids),
        "active_plans": active_plans,
        "athletes_needing_attention": len(attention_list),
        "attention_list": attention_list,
        "athlete_summaries": athlete_summaries
    }
