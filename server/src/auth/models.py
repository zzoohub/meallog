"""Authentication domain models."""

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from pydantic import EmailStr
from sqlalchemy import JSON, Column, String
from sqlmodel import Field, Relationship, SQLModel

from src.models import BaseModel, SoftDeleteMixin, TimestampMixin, UUIDMixin


class User(BaseModel, SoftDeleteMixin, table=True):
    """User model."""

    __tablename__ = "users"

    username: str = Field(
        sa_column=Column(String(50), unique=True, nullable=False, index=True)
    )
    phone: str = Field(
        sa_column=Column(String(20), unique=True, nullable=False, index=True)
    )
    email: EmailStr | None = Field(
        default=None,
        sa_column=Column(String(255), unique=True, nullable=True, index=True)
    )
    avatar_url: str | None = Field(default=None, max_length=500)
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    last_login_at: datetime | None = Field(default=None)

    # Relationships
    sessions: list["UserSession"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    phone_verifications: list["PhoneVerification"] = Relationship(
        back_populates=None,
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "dynamic"},
    )


class PhoneVerification(UUIDMixin, TimestampMixin, SQLModel, table=True):
    """Phone verification model."""

    __tablename__ = "phone_verifications"

    phone: str = Field(sa_column=Column(String(20), nullable=False, index=True))
    verification_code: str = Field(sa_column=Column(String(6), nullable=False))
    attempts: int = Field(default=0)
    is_verified: bool = Field(default=False)
    expires_at: datetime = Field(nullable=False)
    verified_at: datetime | None = Field(default=None)


class UserSession(UUIDMixin, TimestampMixin, SQLModel, table=True):
    """User session model."""

    __tablename__ = "user_sessions"

    user_id: UUID = Field(foreign_key="users.id", nullable=False, index=True)
    token_hash: str = Field(
        sa_column=Column(String(64), unique=True, nullable=False, index=True)
    )
    device_info: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    ip_address: str | None = Field(default=None, max_length=45)
    expires_at: datetime = Field(nullable=False)
    last_used_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    user: User = Relationship(back_populates="sessions")