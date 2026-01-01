from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import List
from datetime import datetime

from app.db.base import get_db
from app.models.user import User, UserRole
from app.models.message import Message
from app.models.trainer_athlete import TrainerAthleteAssignment
from app.schemas.message import (
    MessageCreate,
    MessageInDB,
    MessageWithUsers,
    Conversation,
)
from app.api.auth import get_current_user

router = APIRouter()


def can_message_user(db: Session, sender: User, recipient_id: int) -> bool:
    """Check if sender can message recipient (must be trainer-athlete relationship)"""
    if sender.role == UserRole.ADMIN:
        return True

    # Check for active assignment between users
    assignment = db.query(TrainerAthleteAssignment).filter(
        TrainerAthleteAssignment.is_active == True,
        or_(
            and_(
                TrainerAthleteAssignment.trainer_id == sender.id,
                TrainerAthleteAssignment.athlete_id == recipient_id
            ),
            and_(
                TrainerAthleteAssignment.trainer_id == recipient_id,
                TrainerAthleteAssignment.athlete_id == sender.id
            )
        )
    ).first()

    return assignment is not None


@router.post("/", response_model=MessageInDB, status_code=status.HTTP_201_CREATED)
def send_message(
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a message to another user"""
    # Verify recipient exists
    recipient = db.query(User).filter(User.id == message_data.recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    # Verify sender can message recipient
    if not can_message_user(db, current_user, message_data.recipient_id):
        raise HTTPException(
            status_code=403,
            detail="You can only message users you have an active trainer-athlete relationship with"
        )

    message = Message(
        sender_id=current_user.id,
        recipient_id=message_data.recipient_id,
        content=message_data.content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get("/conversations", response_model=List[Conversation])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get list of conversations with last message"""
    # Get all messages where user is sender or recipient
    subq = db.query(
        func.max(Message.id).label('max_id'),
        func.case(
            (Message.sender_id == current_user.id, Message.recipient_id),
            else_=Message.sender_id
        ).label('other_user_id')
    ).filter(
        or_(
            Message.sender_id == current_user.id,
            Message.recipient_id == current_user.id
        )
    ).group_by('other_user_id').subquery()

    # Get the actual messages
    messages = db.query(Message).join(
        subq, Message.id == subq.c.max_id
    ).all()

    conversations = []
    for msg in messages:
        other_user_id = msg.recipient_id if msg.sender_id == current_user.id else msg.sender_id
        other_user = db.query(User).filter(User.id == other_user_id).first()
        if not other_user:
            continue

        # Count unread messages from this user
        unread_count = db.query(Message).filter(
            Message.sender_id == other_user_id,
            Message.recipient_id == current_user.id,
            Message.is_read == False
        ).count()

        conversations.append(Conversation(
            user_id=other_user.id,
            user_name=other_user.full_name,
            user_email=other_user.email,
            last_message=msg.content[:100] + ('...' if len(msg.content) > 100 else ''),
            last_message_time=msg.created_at,
            unread_count=unread_count
        ))

    # Sort by last message time
    conversations.sort(key=lambda x: x.last_message_time, reverse=True)
    return conversations


@router.get("/with/{user_id}", response_model=List[MessageWithUsers])
def get_messages_with_user(
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all messages between current user and specified user"""
    # Verify user exists
    other_user = db.query(User).filter(User.id == user_id).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get messages between the two users
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.recipient_id == user_id),
            and_(Message.sender_id == user_id, Message.recipient_id == current_user.id)
        )
    ).order_by(Message.created_at.desc()).offset(skip).limit(limit).all()

    # Mark received messages as read
    db.query(Message).filter(
        Message.sender_id == user_id,
        Message.recipient_id == current_user.id,
        Message.is_read == False
    ).update({
        Message.is_read: True,
        Message.read_at: datetime.utcnow()
    })
    db.commit()

    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        recipient = db.query(User).filter(User.id == msg.recipient_id).first()
        result.append(MessageWithUsers(
            id=msg.id,
            sender_id=msg.sender_id,
            recipient_id=msg.recipient_id,
            content=msg.content,
            is_read=msg.is_read,
            created_at=msg.created_at,
            read_at=msg.read_at,
            sender_name=sender.full_name if sender else None,
            sender_email=sender.email if sender else '',
            recipient_name=recipient.full_name if recipient else None,
            recipient_email=recipient.email if recipient else ''
        ))

    # Return in chronological order
    result.reverse()
    return result


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get count of unread messages"""
    count = db.query(Message).filter(
        Message.recipient_id == current_user.id,
        Message.is_read == False
    ).count()
    return {"unread_count": count}


@router.put("/{message_id}/read")
def mark_message_as_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a message as read"""
    message = db.query(Message).filter(
        Message.id == message_id,
        Message.recipient_id == current_user.id
    ).first()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    message.is_read = True
    message.read_at = datetime.utcnow()
    db.commit()

    return {"success": True}
