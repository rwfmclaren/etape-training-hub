from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Ride(Base):
    __tablename__ = "rides"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)

    distance_km = Column(Float, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    elevation_gain_m = Column(Float)
    avg_speed_kmh = Column(Float)
    max_speed_kmh = Column(Float)
    avg_power_watts = Column(Integer)
    avg_heart_rate = Column(Integer)
    max_heart_rate = Column(Integer)
    avg_cadence = Column(Integer)

    ride_date = Column(DateTime, nullable=False)
    route_name = Column(String)
    ride_type = Column(String)  # training, recovery, race, etc.

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="rides")
