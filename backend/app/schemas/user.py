from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, EmailStr, field_validator, AliasChoices


class UserBase(BaseModel):
    """Base user attributes."""
    name: str = Field(..., min_length=2, max_length=100, description="User's full name", examples=["Aditya Raj"])
    email: EmailStr = Field(..., description="Unique email address", examples=["aditya@example.com"])

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        """Store email in normalized lowercase form."""
        if isinstance(v, str):
            return v.strip().lower()
        return v


class UserRegisterRequest(BaseModel):
    """Registration request payload."""
    name: str = Field(..., min_length=2, max_length=100, description="User's full name", examples=["Test User"])
    email: EmailStr = Field(..., description="Valid email address", examples=["test@example.com"])
    password: str = Field(..., min_length=8, max_length=128, description="Password (at least 8 characters)", examples=["StrongPassword123"])

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class UserLoginRequest(BaseModel):
    """Login request payload."""
    email: EmailStr = Field(..., description="Registered email address", examples=["test@example.com"])
    password: str = Field(..., min_length=1, description="Account password", examples=["StrongPassword123"])

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class UserUpdateRequest(BaseModel):
    """Profile update request payload."""
    name: str = Field(..., min_length=2, max_length=100, description="Updated full name", examples=["Aditya Raj"])


class UserInDB(UserBase):
    """User document representation as stored in MongoDB 'users' collection."""
    id: Optional[str] = Field(default=None, alias="_id", description="MongoDB ObjectId as string")
    password_hash: str = Field(..., description="Securely salted Argon2 password hash (never plaintext)")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Creation timestamp")
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Last update timestamp")

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "_id": "6725ea9478f691bdf1012345",
                "name": "Test User",
                "email": "test@example.com",
                "password_hash": "$argon2id$v=19$m=65536,t=3,p=4$...",
                "created_at": "2026-11-02T12:00:00Z",
                "updated_at": "2026-11-02T12:00:00Z",
            }
        },
    }


class UserPublic(UserBase):
    """Safe public user representation without sensitive fields."""
    id: str = Field(validation_alias=AliasChoices("id", "_id"), description="Unique user identifier")
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "id": "6725ea9478f691bdf1012345",
                "name": "Test User",
                "email": "test@example.com",
                "created_at": "2026-11-02T12:00:00Z",
                "updated_at": "2026-11-02T12:00:00Z",
            }
        },
    }


class TokenResponse(BaseModel):
    """JWT Access Token response model."""
    access_token: str = Field(..., description="Signed JWT Bearer access token")
    token_type: str = Field(default="bearer", description="Token authentication type")
    expires_in: int = Field(..., description="Token lifespan in seconds", examples=[86400])
    user: UserPublic = Field(..., description="Public profile of authenticated user")
