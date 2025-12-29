from sqlalchemy import Column, Integer, ForeignKey, DateTime, String, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class TrainerAthleteRequest(Base):
    __tablename__ = "trainer_athlete_requests"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    trainer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending", nullable=False)  # pending, approved, rejected
    message = Column(String)  # Optional message from athlete
    created_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime)

    # Relationships
    athlete = relationship("User", foreign_keys=[athlete_id], backref="trainer_requests_sent")
    trainer = relationship("User", foreign_keys=[trainer_id], backref="trainer_requests_received")


class TrainerAthleteAssignment(Base):
    __tablename__ = "trainer_athlete_assignments"

    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    athlete_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    notes = Column(String)  # Trainer notes about athlete

    # Relationships
    trainer = relationship("User", foreign_keys=[trainer_id], backref="assigned_athletes")
    athlete = relationship("User", foreign_keys=[athlete_id], backref="assigned_trainers")
