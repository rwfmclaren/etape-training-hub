from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.db.base import get_db
from app.models.user import User, UserRole
from app.models.invite_token import InviteToken
from app.schemas.user import UserCreateWithInvite, User as UserSchema, Token
from app.schemas.invite_token import InviteTokenPublic
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
)
from app.core.config import settings

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    if user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is locked"
        )
    return user


@router.post("/register", response_model=UserSchema)
def register(user_in: UserCreateWithInvite, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    role = UserRole.ATHLETE  # Default role
    invite = None

    # Check invite token if provided
    if user_in.invite_token:
        invite = db.query(InviteToken).filter(
            InviteToken.token == user_in.invite_token
        ).first()
        
        if not invite:
            raise HTTPException(status_code=400, detail="Invalid invite token")
        
        if not invite.is_valid:
            if invite.used_at:
                raise HTTPException(status_code=400, detail="Invite token has already been used")
            if invite.is_expired:
                raise HTTPException(status_code=400, detail="Invite token has expired")
            raise HTTPException(status_code=400, detail="Invite token is no longer valid")
        
        # Check if invite email matches (if email was pre-set)
        if invite.email and invite.email.lower() != user_in.email.lower():
            raise HTTPException(
                status_code=400, 
                detail="This invite was sent to a different email address"
            )
        
        role = invite.role

    hashed_password = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Mark invite as used
    if invite:
        invite.used_at = datetime.utcnow()
        invite.used_by_id = user.id
        db.commit()

    return user


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is locked. Please contact an administrator."
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserSchema)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/invite/{token}", response_model=InviteTokenPublic)
def validate_invite_token(token: str, db: Session = Depends(get_db)):
    """Validate an invite token and return its details (public endpoint)"""
    invite = db.query(InviteToken).filter(InviteToken.token == token).first()
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invite token not found")
    
    return invite
