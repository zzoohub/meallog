"""Notifications domain models."""

from datetime import datetime, timezone
from typing import Any, Literal
from uuid import UUID

from sqlalchemy import JSON, Column, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlmodel import Field, Relationship, SQLModel

from src.auth.models import User
from src.models import BaseModel, TimestampMixin, UUIDMixin


class PushToken(TimestampMixin, SQLModel, table=True):
    """Push notification token model."""

    __tablename__ = "push_tokens"
    __table_args__ = (
        Index("idx_push_tokens_user_platform", "user_id", "platform"),
        Index("idx_push_tokens_token", "token", unique=True),
    )

    user_id: UUID = Field(foreign_key="users.id", primary_key=True, index=True)
    platform: Literal["ios", "android", "web"] = Field(
        sa_column=Column(String(20), primary_key=True)
    )
    token: str = Field(sa_column=Column(String(500), nullable=False, unique=True))
    device_id: str | None = Field(default=None, sa_column=Column(String(100), index=True))
    app_version: str | None = Field(default=None, max_length=20)
    is_active: bool = Field(default=True)
    last_used_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    user: User = Relationship()


class Notification(BaseModel, table=True):
    """Notification model."""

    __tablename__ = "notifications"
    __table_args__ = (
        Index("idx_notifications_user_type", "user_id", "notification_type"),
        Index("idx_notifications_created_at", "created_at"),
        Index("idx_notifications_scheduled_for", "scheduled_for"),
    )

    user_id: UUID = Field(foreign_key="users.id", index=True)
    notification_type: Literal[
        "meal_reminder",
        "goal_achievement",
        "social_like",
        "social_comment",
        "social_follow",
        "streak_milestone",
        "weekly_summary",
        "ai_insight",
        "system_announcement",
    ] = Field(sa_column=Column(String(50), nullable=False, index=True))
    
    title: str = Field(sa_column=Column(String(255), nullable=False))
    body: str = Field(sa_column=Column(String(500), nullable=False))
    data: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    
    # Delivery scheduling
    scheduled_for: datetime | None = Field(default=None, index=True)
    is_delivered: bool = Field(default=False, index=True)
    delivered_at: datetime | None = Field(default=None)
    
    # User interaction
    is_read: bool = Field(default=False, index=True)
    read_at: datetime | None = Field(default=None)
    is_clicked: bool = Field(default=False)
    clicked_at: datetime | None = Field(default=None)
    
    # Delivery metadata
    push_response: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    delivery_attempts: int = Field(default=0)
    last_delivery_attempt: datetime | None = Field(default=None)

    # Relationships
    user: User = Relationship()


class NotificationTemplate(UUIDMixin, TimestampMixin, SQLModel, table=True):
    """Notification template model."""

    __tablename__ = "notification_templates"

    template_key: str = Field(sa_column=Column(String(100), unique=True, nullable=False, index=True))
    notification_type: Literal[
        "meal_reminder",
        "goal_achievement",
        "social_like",
        "social_comment",
        "social_follow",
        "streak_milestone",
        "weekly_summary",
        "ai_insight",
        "system_announcement",
    ] = Field(sa_column=Column(String(50), nullable=False))
    
    title_template: str = Field(sa_column=Column(String(255), nullable=False))
    body_template: str = Field(sa_column=Column(String(500), nullable=False))
    
    # Template variables and their types
    variables: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    
    # Delivery settings
    is_active: bool = Field(default=True)
    priority: Literal["low", "normal", "high"] = Field(default="normal")
    
    # Localization support
    language: Literal["en", "ko"] = Field(default="en")


class NotificationQueue(UUIDMixin, TimestampMixin, SQLModel, table=True):
    """Notification queue for batch processing."""

    __tablename__ = "notification_queue"
    __table_args__ = (
        Index("idx_notification_queue_status", "status"),
        Index("idx_notification_queue_scheduled", "scheduled_for"),
    )

    notification_id: UUID = Field(foreign_key="notifications.id", index=True)
    status: Literal["pending", "processing", "sent", "failed", "cancelled"] = Field(
        default="pending",
        sa_column=Column(String(20), nullable=False, index=True)
    )
    scheduled_for: datetime = Field(nullable=False, index=True)
    processed_at: datetime | None = Field(default=None)
    error_message: str | None = Field(default=None)
    retry_count: int = Field(default=0, ge=0)
    max_retries: int = Field(default=3, ge=0)

    # Relationships
    notification: Notification = Relationship()