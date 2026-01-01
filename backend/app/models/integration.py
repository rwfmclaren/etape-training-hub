from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider = Column(String, nullable=False)  # 'strava', 'garmin', etc.
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    athlete_id = Column(String, nullable=True)  # Strava athlete ID
    connected_at = Column(DateTime, default=datetime.utcnow)
    last_sync = Column(DateTime, nullable=True)

    user = relationship("User", backref="integrations")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    source = Column(String, nullable=False)  # 'strava', 'manual', 'garmin'
    external_id = Column(String, nullable=True, index=True)  # ID from source system
    activity_type = Column(String, nullable=False)  # 'ride', 'run', 'swim', etc.
    name = Column(String, nullable=False)
    activity_date = Column(DateTime, nullable=False)
    duration_minutes = Column(Float, nullable=True)
    distance_km = Column(Float, nullable=True)
    elevation_m = Column(Float, nullable=True)
    calories = Column(Integer, nullable=True)
    heart_rate_avg = Column(Integer, nullable=True)
    heart_rate_max = Column(Integer, nullable=True)
    power_avg = Column(Integer, nullable=True)
    power_max = Column(Integer, nullable=True)
    cadence_avg = Column(Integer, nullable=True)
    speed_avg_kmh = Column(Float, nullable=True)
    speed_max_kmh = Column(Float, nullable=True)
    data_json = Column(JSON, nullable=True)  # Raw data from source
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="activities")
