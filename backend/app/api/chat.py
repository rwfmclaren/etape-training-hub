from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

from app.db.base import get_db
from app.models.user import User
from app.models.ride import Ride
from app.models.workout import Workout
from app.models.goal import Goal
from app.models.training_plan import TrainingPlan, PlannedWorkout
from app.api.auth import get_current_user
from app.core.claude_service import claude_service

router = APIRouter()


class ChatMessage(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    success: bool


@router.post("/", response_model=ChatResponse)
async def chat_with_ai(
    chat: ChatMessage,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chat with AI about training progress and recommendations"""
    
    if not claude_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured. Please set ANTHROPIC_API_KEY."
        )
    
    # Gather user context
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    # Recent rides
    recent_rides = db.query(Ride).filter(
        Ride.user_id == current_user.id,
        Ride.ride_date >= week_ago.date()
    ).all()
    
    # Recent workouts
    recent_workouts = db.query(Workout).filter(
        Workout.user_id == current_user.id,
        Workout.workout_date >= week_ago.date()
    ).all()
    
    # Active goals
    active_goals = db.query(Goal).filter(
        Goal.user_id == current_user.id,
        Goal.is_completed == False
    ).all()
    
    # Current training plan
    training_plan = db.query(TrainingPlan).filter(
        TrainingPlan.athlete_id == current_user.id,
        TrainingPlan.is_active == True
    ).first()
    
    # Build context
    context_parts = []
    context_parts.append(f"User: {current_user.full_name or current_user.email}")
    context_parts.append(f"Role: {current_user.role}")
    
    if recent_rides:
        total_km = sum(r.distance_km for r in recent_rides)
        context_parts.append(f"This week: {len(recent_rides)} rides, {total_km:.1f}km total")
    else:
        context_parts.append("No rides this week")
    
    if recent_workouts:
        context_parts.append(f"This week: {len(recent_workouts)} workouts")
    else:
        context_parts.append("No workouts this week")
    
    if active_goals:
        goals_text = ", ".join([g.title for g in active_goals[:3]])
        context_parts.append(f"Active goals: {goals_text}")
    
    if training_plan:
        context_parts.append(f"Current plan: {training_plan.title}")
        upcoming = db.query(PlannedWorkout).filter(
            PlannedWorkout.training_plan_id == training_plan.id,
            PlannedWorkout.is_completed == False
        ).order_by(PlannedWorkout.scheduled_date).limit(3).all()
        if upcoming:
            context_parts.append(f"Upcoming workouts: {', '.join([w.title for w in upcoming])}")
    
    context = "
".join(context_parts)
    
    prompt = f"""You are a helpful AI training assistant for a cycling and fitness app called Etape Training Hub.
    
User context:
{context}

User question: {chat.message}

Provide a helpful, encouraging, and personalized response. Keep it concise (2-3 paragraphs max).
Focus on actionable advice when relevant. If asked about nutrition, give general guidance.
Be supportive and motivating."""

    try:
        response = claude_service.client.messages.create(
            model="claude-sonnet-4-20250114",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return ChatResponse(
            response=response.content[0].text,
            success=True
        )
    except Exception as e:
        return ChatResponse(
            response=f"Sorry, I encountered an error: {str(e)}",
            success=False
        )
