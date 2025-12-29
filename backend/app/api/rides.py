from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.base import get_db
from app.models.user import User
from app.models.ride import Ride
from app.schemas.ride import Ride as RideSchema, RideCreate, RideUpdate
from app.api.auth import get_current_user
from app.api.deps import get_accessible_user_ids

router = APIRouter()


@router.get("/", response_model=List[RideSchema])
def get_rides(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    accessible_ids = get_accessible_user_ids(current_user, db)

    query = db.query(Ride)
    if accessible_ids is not None:  # Not admin
        query = query.filter(Ride.user_id.in_(accessible_ids))

    rides = query.offset(skip).limit(limit).all()
    return rides


@router.post("/", response_model=RideSchema)
def create_ride(
    ride_in: RideCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ride = Ride(**ride_in.model_dump(), user_id=current_user.id)
    db.add(ride)
    db.commit()
    db.refresh(ride)
    return ride


@router.get("/{ride_id}", response_model=RideSchema)
def get_ride(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    accessible_ids = get_accessible_user_ids(current_user, db)

    query = db.query(Ride).filter(Ride.id == ride_id)
    if accessible_ids is not None:  # Not admin
        query = query.filter(Ride.user_id.in_(accessible_ids))

    ride = query.first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")
    return ride


@router.put("/{ride_id}", response_model=RideSchema)
def update_ride(
    ride_id: int,
    ride_in: RideUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.user_id == current_user.id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    update_data = ride_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ride, field, value)

    db.commit()
    db.refresh(ride)
    return ride


@router.delete("/{ride_id}")
def delete_ride(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.user_id == current_user.id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    db.delete(ride)
    db.commit()
    return {"message": "Ride deleted successfully"}
