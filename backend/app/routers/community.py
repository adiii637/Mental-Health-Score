"""FastAPI router for the Peer Support Community endpoints."""
import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query, status
from pymongo.asynchronous.database import AsyncDatabase

from app.core.dependencies import get_current_user
from app.core.database import get_db
from app.schemas.community import (
    CommentCreate,
    CommentListResponse,
    CommentResponse,
    PostCreate,
    PostListResponse,
    PostResponse,
    SupportResponse,
)
from app.services.community_service import CommunityService

logger = logging.getLogger("mentalwell.routers.community")

router = APIRouter(prefix="/community", tags=["Community"])


# ---------------------------------------------------------------------------
# Post endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/posts",
    response_model=PostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new community post",
)
async def create_post(
    data: PostCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    return await CommunityService.create_post(db, current_user, data)


@router.get(
    "/posts",
    response_model=PostListResponse,
    summary="Get paginated community posts",
)
async def get_posts(
    category: Optional[str] = Query(default=None, description="Filter by category"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    my_posts: bool = Query(default=False, description="Return only the current user's posts"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    return await CommunityService.get_posts(db, current_user, category, limit, offset, my_posts)


@router.delete(
    "/posts/{post_id}",
    summary="Delete own community post",
)
async def delete_post(
    post_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    return await CommunityService.delete_post(db, current_user, post_id)


# ---------------------------------------------------------------------------
# Comment endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/posts/{post_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a comment to a post",
)
async def create_comment(
    post_id: str,
    data: CommentCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    return await CommunityService.create_comment(db, current_user, post_id, data)


@router.get(
    "/posts/{post_id}/comments",
    response_model=CommentListResponse,
    summary="Get all comments for a post",
)
async def get_comments(
    post_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    return await CommunityService.get_comments(db, current_user, post_id)


@router.delete(
    "/comments/{comment_id}",
    summary="Delete own comment",
)
async def delete_comment(
    comment_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    return await CommunityService.delete_comment(db, current_user, comment_id)


# ---------------------------------------------------------------------------
# Reaction endpoint
# ---------------------------------------------------------------------------

@router.post(
    "/posts/{post_id}/support",
    response_model=SupportResponse,
    summary="Toggle support reaction on a post",
)
async def toggle_support(
    post_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    return await CommunityService.toggle_support(db, current_user, post_id)
