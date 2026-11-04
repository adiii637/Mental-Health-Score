from datetime import datetime, timezone
from typing import Literal, Optional, List
from pydantic import BaseModel, Field


class JournalMood(str):
    STRAINED = "strained"
    BALANCED = "balanced"
    STRONG = "strong"


class JournalBase(BaseModel):
    """Base journal entry attributes."""
    mood: Literal["strained", "balanced", "strong"] = Field(
        ...,
        description="Mood assessment for the journal entry",
        examples=["balanced"],
    )
    content: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Private journal reflection content",
        examples=["Morning walk cleared my head before studying."],
    )
    title: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Optional title for the reflection",
        examples=["Morning thoughts"],
    )


class JournalCreate(JournalBase):
    """Payload to create a new journal entry."""
    pass


class JournalUpdate(BaseModel):
    """Payload to update an existing journal entry."""
    mood: Optional[Literal["strained", "balanced", "strong"]] = Field(
        default=None,
        description="Updated mood assessment",
    )
    content: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=10000,
        description="Updated journal content",
    )
    title: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Updated journal title",
    )


class JournalResponse(BaseModel):
    """Public representation of a journal entry."""
    id: str = Field(..., description="MongoDB ObjectId string")
    user_id: str = Field(..., description="Owning user's ID string")
    title: Optional[str] = Field(default=None, description="Optional title")
    mood: Literal["strained", "balanced", "strong"] = Field(..., description="Mood rating")
    content: str = Field(..., description="Reflection text")
    created_at: datetime = Field(..., description="Creation UTC timestamp")
    updated_at: datetime = Field(..., description="Last updated UTC timestamp")

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "id": "6725ea9478f691bdf1099999",
                "user_id": "6725ea9478f691bdf1012345",
                "title": "Study session reflection",
                "mood": "balanced",
                "content": "Focused on ML algorithms for 2 hours. Took mindful breathing breaks.",
                "created_at": "2026-11-02T12:00:00Z",
                "updated_at": "2026-11-02T12:00:00Z",
            }
        },
    }


class JournalListResponse(BaseModel):
    """Paginated list of journal entries."""
    journals: List[JournalResponse]
    total: int = Field(..., description="Total entries count for this user")
    limit: int
    offset: int


class JournalInDB(JournalBase):
    """Journal document representation stored in MongoDB 'journals' collection."""
    id: Optional[str] = Field(default=None, alias="_id", description="MongoDB ObjectId as string")
    user_id: str = Field(..., description="Reference to the owning user's _id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Creation timestamp")
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Last update timestamp")

    model_config = {
        "populate_by_name": True,
    }
