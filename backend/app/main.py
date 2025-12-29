from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.base import Base, engine
from app.api import auth, rides, workouts, nutrition, goals, trainer_athlete, training_plans, admin

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(rides.router, prefix=f"{settings.API_V1_STR}/rides", tags=["rides"])
app.include_router(workouts.router, prefix=f"{settings.API_V1_STR}/workouts", tags=["workouts"])
app.include_router(nutrition.router, prefix=f"{settings.API_V1_STR}/nutrition", tags=["nutrition"])
app.include_router(goals.router, prefix=f"{settings.API_V1_STR}/goals", tags=["goals"])
app.include_router(trainer_athlete.router, prefix=f"{settings.API_V1_STR}/trainer-requests", tags=["trainer-athlete"])
app.include_router(training_plans.router, prefix=f"{settings.API_V1_STR}/training-plans", tags=["training-plans"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])


@app.get("/")
def root():
    return {"message": "Welcome to Etape Training Hub API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
