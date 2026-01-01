from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class MessageBase(BaseModel):
    content: str


class MessageCreate(MessageBase):
    recipient_id: int


class MessageUpdate(BaseModel):
    is_read: Optional[bool] = None


class MessageInDB(MessageBase):
    id: int
    sender_id: int
    recipient_id: int
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MessageWithUsers(MessageInDB):
    sender_name: Optional[str] = None
    sender_email: str
    recipient_name: Optional[str] = None
    recipient_email: str


class Conversation(BaseModel):
    user_id: int
    user_name: Optional[str] = None
    user_email: str
    last_message: str
    last_message_time: datetime
    unread_count: int
