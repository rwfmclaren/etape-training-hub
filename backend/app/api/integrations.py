from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import httpx

from app.db.base import get_db
from app.models.user import User
from app.models.integration import Integration, Activity
from app.schemas.integration import (
    IntegrationStatus,
    ActivityInDB,
    SyncResult,
)
from app.api.auth import get_current_user
from app.core.config import settings

router = APIRouter()

STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize"
STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"
STRAVA_API_URL = "https://www.strava.com/api/v3"


def get_strava_integration(db: Session, user_id: int) -> Integration | None:
    return db.query(Integration).filter(
        Integration.user_id == user_id,
        Integration.provider == "strava"
    ).first()


async def refresh_strava_token(db: Session, integration: Integration) -> bool:
    """Refresh Strava access token if expired"""
    if not integration.token_expires_at or integration.token_expires_at > datetime.utcnow():
        return True  # Token still valid

    if not integration.refresh_token:
        return False

    async with httpx.AsyncClient() as client:
        response = await client.post(STRAVA_TOKEN_URL, data={
            "client_id": settings.STRAVA_CLIENT_ID,
            "client_secret": settings.STRAVA_CLIENT_SECRET,
            "grant_type": "refresh_token",
            "refresh_token": integration.refresh_token
        })

        if response.status_code != 200:
            return False

        data = response.json()
        integration.access_token = data["access_token"]
        integration.refresh_token = data.get("refresh_token", integration.refresh_token)
        integration.token_expires_at = datetime.fromtimestamp(data["expires_at"])
        db.commit()
        return True


@router.get("/status", response_model=List[IntegrationStatus])
def get_integration_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get status of all integrations for current user"""
    integrations = db.query(Integration).filter(
        Integration.user_id == current_user.id
    ).all()

    status_list = []

    # Strava status
    strava = next((i for i in integrations if i.provider == "strava"), None)
    status_list.append(IntegrationStatus(
        provider="strava",
        connected=strava is not None,
        connected_at=strava.connected_at if strava else None,
        last_sync=strava.last_sync if strava else None,
        athlete_id=strava.athlete_id if strava else None
    ))

    return status_list


@router.get("/strava/connect")
def connect_strava(
    current_user: User = Depends(get_current_user),
):
    """Get Strava OAuth authorization URL"""
    if not settings.STRAVA_CLIENT_ID or not settings.STRAVA_REDIRECT_URI:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Strava integration not configured"
        )

    # Include user ID in state for callback
    state = f"user_{current_user.id}"

    auth_url = (
        f"{STRAVA_AUTH_URL}"
        f"?client_id={settings.STRAVA_CLIENT_ID}"
        f"&redirect_uri={settings.STRAVA_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=read,activity:read_all"
        f"&state={state}"
    )

    return {"auth_url": auth_url}


@router.get("/strava/callback")
async def strava_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    """Handle Strava OAuth callback"""
    if not settings.STRAVA_CLIENT_ID or not settings.STRAVA_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Strava integration not configured"
        )

    # Extract user ID from state
    if not state.startswith("user_"):
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    try:
        user_id = int(state.replace("user_", ""))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        response = await client.post(STRAVA_TOKEN_URL, data={
            "client_id": settings.STRAVA_CLIENT_ID,
            "client_secret": settings.STRAVA_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code"
        })

        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange code for token"
            )

        data = response.json()

    # Get or create integration
    integration = get_strava_integration(db, user_id)
    if integration:
        integration.access_token = data["access_token"]
        integration.refresh_token = data.get("refresh_token")
        integration.token_expires_at = datetime.fromtimestamp(data["expires_at"])
        integration.athlete_id = str(data["athlete"]["id"])
    else:
        integration = Integration(
            user_id=user_id,
            provider="strava",
            access_token=data["access_token"],
            refresh_token=data.get("refresh_token"),
            token_expires_at=datetime.fromtimestamp(data["expires_at"]),
            athlete_id=str(data["athlete"]["id"])
        )
        db.add(integration)

    db.commit()

    # Redirect to frontend integrations page
    frontend_url = settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:5173"
    # Find the non-localhost origin for production
    for origin in settings.CORS_ORIGINS:
        if "railway" in origin or "vercel" in origin or "netlify" in origin:
            frontend_url = origin
            break

    return RedirectResponse(url=f"{frontend_url}/integrations?connected=strava")


@router.post("/strava/sync", response_model=SyncResult)
async def sync_strava_activities(
    days: int = Query(default=30, le=90),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Sync recent activities from Strava"""
    integration = get_strava_integration(db, current_user.id)
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Strava not connected"
        )

    # Refresh token if needed
    if not await refresh_strava_token(db, integration):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to refresh Strava token. Please reconnect."
        )

    # Fetch activities from Strava
    after_timestamp = int((datetime.utcnow() - timedelta(days=days)).timestamp())

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{STRAVA_API_URL}/athlete/activities",
            headers={"Authorization": f"Bearer {integration.access_token}"},
            params={"after": after_timestamp, "per_page": 100}
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to fetch activities from Strava"
            )

        activities_data = response.json()

    synced_count = 0
    for activity_data in activities_data:
        external_id = str(activity_data["id"])

        # Check if activity already exists
        existing = db.query(Activity).filter(
            Activity.user_id == current_user.id,
            Activity.source == "strava",
            Activity.external_id == external_id
        ).first()

        if existing:
            continue  # Skip already synced activities

        # Map Strava activity type
        strava_type = activity_data.get("type", "Workout").lower()
        activity_type_map = {
            "ride": "cycling",
            "virtualride": "cycling",
            "run": "running",
            "virtualrun": "running",
            "swim": "swimming",
            "walk": "walking",
            "hike": "hiking",
            "weighttraining": "strength",
            "yoga": "yoga",
        }
        activity_type = activity_type_map.get(strava_type, strava_type)

        # Create activity record
        activity = Activity(
            user_id=current_user.id,
            source="strava",
            external_id=external_id,
            activity_type=activity_type,
            name=activity_data.get("name", "Strava Activity"),
            activity_date=datetime.fromisoformat(
                activity_data["start_date"].replace("Z", "+00:00")
            ),
            duration_minutes=activity_data.get("moving_time", 0) / 60,
            distance_km=activity_data.get("distance", 0) / 1000,
            elevation_m=activity_data.get("total_elevation_gain"),
            calories=activity_data.get("calories"),
            heart_rate_avg=activity_data.get("average_heartrate"),
            heart_rate_max=activity_data.get("max_heartrate"),
            power_avg=activity_data.get("average_watts"),
            power_max=activity_data.get("max_watts"),
            cadence_avg=activity_data.get("average_cadence"),
            speed_avg_kmh=(activity_data.get("average_speed", 0) * 3.6) if activity_data.get("average_speed") else None,
            speed_max_kmh=(activity_data.get("max_speed", 0) * 3.6) if activity_data.get("max_speed") else None,
            data_json=activity_data
        )
        db.add(activity)
        synced_count += 1

    # Update last sync time
    integration.last_sync = datetime.utcnow()
    db.commit()

    return SyncResult(
        success=True,
        activities_synced=synced_count,
        message=f"Successfully synced {synced_count} new activities from Strava"
    )


@router.delete("/strava/disconnect")
def disconnect_strava(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Disconnect Strava integration"""
    integration = get_strava_integration(db, current_user.id)
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strava not connected"
        )

    db.delete(integration)
    db.commit()

    return {"success": True, "message": "Strava disconnected"}


@router.get("/activities", response_model=List[ActivityInDB])
def get_activities(
    source: str = Query(default=None),
    activity_type: str = Query(default=None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user's synced activities"""
    query = db.query(Activity).filter(Activity.user_id == current_user.id)

    if source:
        query = query.filter(Activity.source == source)
    if activity_type:
        query = query.filter(Activity.activity_type == activity_type)

    activities = query.order_by(Activity.activity_date.desc()).offset(skip).limit(limit).all()
    return activities
