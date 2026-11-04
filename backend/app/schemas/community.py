"""Pydantic v2 schemas for the Peer Support Community feature."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class PostCategory(str, Enum):
    general = "General"
    anxiety = "Anxiety"
    stress = "Stress"
    depression = "Depression"
    relationships = "Relationships"
    academic = "Academic"
    self_care = "Self-Care"
    gratitude = "Gratitude"


# ---------------------------------------------------------------------------
# Post schemas
# ---------------------------------------------------------------------------

class PostCreate(BaseModel):
    content: str = Field(..., min_length=10, max_length=2000)
    category: PostCategory = PostCategory.general
    is_anonymous: bool = False

    @field_validator("content")
    @classmethod
    def content_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Post content cannot be empty.")
        return v.strip()


class PostResponse(BaseModel):
    id: str
    content: str
    category: PostCategory
    is_anonymous: bool
    author_display: str          # "Anonymous Student" or the user's name
    is_own_post: bool            # True when the requesting user owns this post
    support_count: int
    comment_count: int
    has_supported: bool          # True if the requesting user already reacted
    created_at: datetime


class PostListResponse(BaseModel):
    posts: List[PostResponse]
    total: int
    limit: int
    offset: int


# ---------------------------------------------------------------------------
# Comment schemas
# ---------------------------------------------------------------------------

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)
    is_anonymous: bool = False

    @field_validator("content")
    @classmethod
    def content_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Comment content cannot be empty.")
        return v.strip()


class CommentResponse(BaseModel):
    id: str
    post_id: str
    content: str
    is_anonymous: bool
    author_display: str
    is_own_comment: bool
    created_at: datetime


class CommentListResponse(BaseModel):
    comments: List[CommentResponse]
    total: int


# ---------------------------------------------------------------------------
# Reaction / Support schema
# ---------------------------------------------------------------------------

class SupportResponse(BaseModel):
    post_id: str
    support_count: int
    has_supported: bool
    message: str
