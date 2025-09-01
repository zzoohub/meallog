"""Analytics domain models."""

from datetime import date, datetime, timezone
from typing import Any, Literal
from uuid import UUID

from sqlalchemy import JSON, CheckConstraint, Column, Date, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlmodel import Field, Relationship, SQLModel

from src.auth.models import User
from src.models import BaseModel, TimestampMixin, UUIDMixin


class AnalyticsEvent(BaseModel, table=True):
    """Analytics event model for tracking user interactions."""

    __tablename__ = "analytics_events"
    __table_args__ = (
        Index("idx_analytics_events_user_type", "user_id", "event_type"),
        Index("idx_analytics_events_created_at", "created_at"),
    )

    user_id: UUID = Field(foreign_key="users.id", index=True)
    event_type: str = Field(sa_column=Column(String(100), nullable=False, index=True))
    event_category: Literal["app", "meal", "social", "camera", "settings"] = Field(
        sa_column=Column(String(50), nullable=False, index=True)
    )
    properties: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    session_id: str | None = Field(default=None, sa_column=Column(String(100), index=True))
    platform: Literal["ios", "android", "web"] | None = Field(
        default=None, 
        sa_column=Column(String(20), nullable=True)
    )
    app_version: str | None = Field(default=None, max_length=20)
    
    # Relationships
    user: User = Relationship()


class DailySummary(UUIDMixin, TimestampMixin, SQLModel, table=True):
    """Daily summary analytics model."""

    __tablename__ = "daily_summaries"
    __table_args__ = (
        Index("idx_daily_summaries_user_date", "user_id", "summary_date", unique=True),
        CheckConstraint("total_calories >= 0", name="positive_calories"),
        CheckConstraint("meals_logged >= 0", name="positive_meals"),
    )

    user_id: UUID = Field(foreign_key="users.id", index=True)
    summary_date: date = Field(sa_column=Column(Date, nullable=False, index=True))
    
    # Meal tracking metrics
    meals_logged: int = Field(default=0, ge=0)
    total_calories: int = Field(default=0, ge=0)
    total_protein_g: float = Field(default=0.0, ge=0)
    total_carbs_g: float = Field(default=0.0, ge=0)
    total_fat_g: float = Field(default=0.0, ge=0)
    total_fiber_g: float = Field(default=0.0, ge=0)
    water_glasses: int = Field(default=0, ge=0)
    
    # Activity metrics
    app_sessions: int = Field(default=0, ge=0)
    total_app_time_minutes: int = Field(default=0, ge=0)
    photos_taken: int = Field(default=0, ge=0)
    
    # Social metrics
    posts_created: int = Field(default=0, ge=0)
    likes_given: int = Field(default=0, ge=0)
    comments_made: int = Field(default=0, ge=0)
    
    # Goals achievement
    calorie_goal_met: bool = Field(default=False)
    protein_goal_met: bool = Field(default=False)
    water_goal_met: bool = Field(default=False)
    meal_frequency_goal_met: bool = Field(default=False)
    
    # Calculated scores (0-100)
    nutrition_score: float = Field(default=0.0, ge=0, le=100)
    consistency_score: float = Field(default=0.0, ge=0, le=100)
    social_engagement_score: float = Field(default=0.0, ge=0, le=100)
    overall_score: float = Field(default=0.0, ge=0, le=100)

    # Relationships
    user: User = Relationship()


class UserProgress(TimestampMixin, SQLModel, table=True):
    """User progress tracking model."""

    __tablename__ = "user_progress"

    user_id: UUID = Field(foreign_key="users.id", primary_key=True)
    
    # Streaks
    current_logging_streak: int = Field(default=0, ge=0)
    longest_logging_streak: int = Field(default=0, ge=0)
    current_goal_streak: int = Field(default=0, ge=0)
    longest_goal_streak: int = Field(default=0, ge=0)
    
    # Achievement dates
    first_meal_logged_at: datetime | None = Field(default=None)
    first_goal_met_at: datetime | None = Field(default=None)
    first_social_post_at: datetime | None = Field(default=None)
    last_active_date: date | None = Field(default=None, sa_column=Column(Date))
    
    # Totals
    total_meals_logged: int = Field(default=0, ge=0)
    total_days_active: int = Field(default=0, ge=0)
    total_photos_taken: int = Field(default=0, ge=0)
    total_social_interactions: int = Field(default=0, ge=0)
    
    # Averages (calculated periodically)
    avg_daily_calories: float | None = Field(default=None, ge=0)
    avg_nutrition_score: float = Field(default=0.0, ge=0, le=100)
    avg_consistency_score: float = Field(default=0.0, ge=0, le=100)

    # Relationships
    user: User = Relationship()


class Achievement(UUIDMixin, TimestampMixin, SQLModel, table=True):
    """User achievements model."""

    __tablename__ = "achievements"
    __table_args__ = (
        Index("idx_achievements_user_type", "user_id", "achievement_type", unique=True),
    )

    user_id: UUID = Field(foreign_key="users.id", index=True)
    achievement_type: str = Field(sa_column=Column(String(100), nullable=False))
    achievement_level: int = Field(default=1, ge=1)  # For multi-level achievements
    unlocked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    progress: float = Field(default=100.0, ge=0, le=100)  # Progress towards achievement (100 = completed)
    achievement_metadata: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))

    # Relationships
    user: User = Relationship()