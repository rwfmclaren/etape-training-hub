from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)

    goal_type = Column(String, nullable=False)  # distance, time, event, power, weight
    target_value = Column(Float)
    current_value = Column(Float)
    unit = Column(String)  # km, hours, watts, kg, etc.

    target_date = Column(DateTime)
    is_completed = Column(Boolean, default=False)
    completed_date = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="goals")
