"""User preferences and settings models."""

from datetime import time
from decimal import Decimal
from typing import Literal
from uuid import UUID

from sqlalchemy import CheckConstraint, Column, Time
from sqlmodel import Field, Relationship, SQLModel

from src.auth.models import User
from src.models import TimestampMixin


class UserPreferences(TimestampMixin, SQLModel, table=True):
    """User preferences model."""

    __tablename__ = "user_preferences"

    user_id: UUID = Field(foreign_key="users.id", primary_key=True)
    language: Literal["en", "ko"] = Field(default="en")
    theme: Literal["light", "dark", "system"] = Field(default="system")
    measurement_units: Literal["metric", "imperial"] = Field(default="metric")

    # Relationship
    user: User = Relationship()


class NotificationSettings(TimestampMixin, SQLModel, table=True):
    """Notification settings model."""

    __tablename__ = "notification_settings"

    user_id: UUID = Field(foreign_key="users.id", primary_key=True)
    meal_reminders: bool = Field(default=True)
    social_notifications: bool = Field(default=True)
    progress_updates: bool = Field(default=True)
    ai_insights: bool = Field(default=True)
    quiet_hours_enabled: bool = Field(default=True)
    quiet_hours_start: time = Field(default=time(22, 0), sa_column=Column(Time))
    quiet_hours_end: time = Field(default=time(7, 0), sa_column=Column(Time))
    frequency: Literal["immediate", "daily", "weekly"] = Field(default="immediate")
    push_enabled: bool = Field(default=True)
    email_enabled: bool = Field(default=False)

    # Relationship
    user: User = Relationship()


class PrivacySettings(TimestampMixin, SQLModel, table=True):
    """Privacy settings model."""

    __tablename__ = "privacy_settings"

    user_id: UUID = Field(foreign_key="users.id", primary_key=True)
    profile_visibility: Literal["public", "friends", "private"] = Field(default="friends")
    location_sharing: bool = Field(default=False)
    analytics_collection: bool = Field(default=True)
    crash_reporting: bool = Field(default=True)
    data_export_photos: bool = Field(default=True)
    data_export_analytics: bool = Field(default=False)

    # Relationship
    user: User = Relationship()


class UserGoals(TimestampMixin, SQLModel, table=True):
    """User goals model."""

    __tablename__ = "user_goals"
    __table_args__ = (
        CheckConstraint(
            "protein_percentage + carbs_percentage + fat_percentage = 100",
            name="valid_macro_percentages",
        ),
    )

    user_id: UUID = Field(foreign_key="users.id", primary_key=True)
    daily_calories: int = Field(default=2000, ge=0)
    protein_percentage: int = Field(default=25, ge=0, le=100)
    carbs_percentage: int = Field(default=45, ge=0, le=100)
    fat_percentage: int = Field(default=30, ge=0, le=100)
    meal_frequency: int = Field(default=3, ge=1, le=10)
    weight_target: Decimal | None = Field(default=None, max_digits=5, decimal_places=2)
    weight_unit: Literal["kg", "lbs"] = Field(default="kg")
    weight_timeframe: Literal["weekly", "monthly"] = Field(default="monthly")
    water_glasses_target: int = Field(default=8, ge=1)
    fiber_grams_target: int = Field(default=25, ge=1)

    # Relationship
    user: User = Relationship()


class CameraSettings(TimestampMixin, SQLModel, table=True):
    """Camera settings model."""

    __tablename__ = "camera_settings"

    user_id: UUID = Field(foreign_key="users.id", primary_key=True)
    quality: Literal["low", "medium", "high"] = Field(default="high")
    ai_processing: bool = Field(default=True)
    auto_capture: bool = Field(default=False)
    flash_default: Literal["auto", "on", "off"] = Field(default="auto")
    save_to_gallery: bool = Field(default=True)

    # Relationship
    user: User = Relationship()