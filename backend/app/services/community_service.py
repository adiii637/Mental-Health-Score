"""Business logic for the Peer Support Community feature."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from pymongo.asynchronous.database import AsyncDatabase

from app.schemas.community import (
    CommentCreate,
    CommentListResponse,
    CommentResponse,
    PostCategory,
    PostCreate,
    PostListResponse,
    PostResponse,
    SupportResponse,
)

logger = logging.getLogger("mentalwell.community_service")

POSTS_COLLECTION = "community_posts"
COMMENTS_COLLECTION = "community_comments"
REACTIONS_COLLECTION = "community_reactions"


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _resolve_oid(id_str: str, label: str = "resource") -> ObjectId:
    """Convert a string ID to ObjectId or raise HTTP 404."""
    try:
        return ObjectId(id_str)
    except (InvalidId, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{label.capitalize()} not found.",
        )


def _format_post(
    doc: Dict[str, Any],
    current_user_id: str,
    support_count: int,
    comment_count: int,
    has_supported: bool,
) -> PostResponse:
    """Convert a MongoDB post document to a PostResponse."""
    owner_id = str(doc.get("user_id", ""))
    is_own = owner_id == current_user_id
    anonymous = doc.get("is_anonymous", False)

    if anonymous and not is_own:
        author_display = "Anonymous Student"
    else:
        author_display = doc.get("author_name", "Student")

    return PostResponse(
        id=str(doc["_id"]),
        content=doc["content"],
        category=PostCategory(doc.get("category", "General")),
        is_anonymous=anonymous,
        author_display=author_display,
        is_own_post=is_own,
        support_count=support_count,
        comment_count=comment_count,
        has_supported=has_supported,
        created_at=doc["created_at"],
    )


def _format_comment(
    doc: Dict[str, Any],
    current_user_id: str,
) -> CommentResponse:
    """Convert a MongoDB comment document to a CommentResponse."""
    owner_id = str(doc.get("user_id", ""))
    is_own = owner_id == current_user_id
    anonymous = doc.get("is_anonymous", False)

    if anonymous and not is_own:
        author_display = "Anonymous Student"
    else:
        author_display = doc.get("author_name", "Student")

    return CommentResponse(
        id=str(doc["_id"]),
        post_id=str(doc["post_id"]),
        content=doc["content"],
        is_anonymous=anonymous,
        author_display=author_display,
        is_own_comment=is_own,
        created_at=doc["created_at"],
    )


# ---------------------------------------------------------------------------
# Post operations
# ---------------------------------------------------------------------------

class CommunityService:

    # ---- Posts ----

    @staticmethod
    async def create_post(
        db: AsyncDatabase,
        current_user: Dict[str, Any],
        data: PostCreate,
    ) -> PostResponse:
        """Insert a new community post."""
        now = datetime.now(timezone.utc)
        user_id_str = str(current_user["_id"])

        doc = {
            "user_id": user_id_str,
            "author_name": current_user.get("name", "Student"),
            "content": data.content,
            "category": data.category.value,
            "is_anonymous": data.is_anonymous,
            "created_at": now,
        }

        result = await db[POSTS_COLLECTION].insert_one(doc)
        doc["_id"] = result.inserted_id
        logger.info("Community post created by user %s", user_id_str)

        return _format_post(doc, user_id_str, 0, 0, False)

    @staticmethod
    async def get_posts(
        db: AsyncDatabase,
        current_user: Dict[str, Any],
        category: Optional[str],
        limit: int,
        offset: int,
        my_posts_only: bool,
    ) -> PostListResponse:
        """Return paginated list of posts, newest first."""
        user_id_str = str(current_user["_id"])

        query: Dict[str, Any] = {}
        if category and category != "All":
            query["category"] = category
        if my_posts_only:
            query["user_id"] = user_id_str

        total = await db[POSTS_COLLECTION].count_documents(query)
        cursor = (
            db[POSTS_COLLECTION]
            .find(query)
            .sort("created_at", -1)
            .skip(offset)
            .limit(limit)
        )
        docs = await cursor.to_list(length=limit)

        # Batch-fetch support counts and comment counts
        post_ids = [str(d["_id"]) for d in docs]

        # Reactions for this user (for has_supported)
        user_reactions = set()
        user_reaction_docs = await db[REACTIONS_COLLECTION].find(
            {"post_id": {"$in": post_ids}, "user_id": user_id_str}
        ).to_list(length=None)
        for reaction in user_reaction_docs:
            user_reactions.add(reaction["post_id"])

        # Aggregate support counts per post
        support_pipeline = [
            {"$match": {"post_id": {"$in": post_ids}}},
            {"$group": {"_id": "$post_id", "count": {"$sum": 1}}},
        ]
        support_counts: Dict[str, int] = {}
        support_cursor = await db[REACTIONS_COLLECTION].aggregate(support_pipeline)
        for bucket in await support_cursor.to_list(length=None):
            support_counts[bucket["_id"]] = bucket["count"]

        # Aggregate comment counts per post
        comment_pipeline = [
            {"$match": {"post_id": {"$in": post_ids}}},
            {"$group": {"_id": "$post_id", "count": {"$sum": 1}}},
        ]
        comment_counts: Dict[str, int] = {}
        comment_cursor = await db[COMMENTS_COLLECTION].aggregate(comment_pipeline)
        for bucket in await comment_cursor.to_list(length=None):
            comment_counts[bucket["_id"]] = bucket["count"]

        posts = [
            _format_post(
                d,
                user_id_str,
                support_counts.get(str(d["_id"]), 0),
                comment_counts.get(str(d["_id"]), 0),
                str(d["_id"]) in user_reactions,
            )
            for d in docs
        ]

        return PostListResponse(posts=posts, total=total, limit=limit, offset=offset)

    @staticmethod
    async def delete_post(
        db: AsyncDatabase,
        current_user: Dict[str, Any],
        post_id: str,
    ) -> Dict[str, str]:
        """Delete own post and its associated comments/reactions."""
        oid = _resolve_oid(post_id, "post")
        user_id_str = str(current_user["_id"])

        post = await db[POSTS_COLLECTION].find_one({"_id": oid})
        if post is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
        if post.get("user_id") != user_id_str:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own posts.")

        await db[POSTS_COLLECTION].delete_one({"_id": oid})
        await db[COMMENTS_COLLECTION].delete_many({"post_id": post_id})
        await db[REACTIONS_COLLECTION].delete_many({"post_id": post_id})

        logger.info("Post %s deleted by user %s", post_id, user_id_str)
        return {"message": "Post deleted successfully."}

    # ---- Comments ----

    @staticmethod
    async def create_comment(
        db: AsyncDatabase,
        current_user: Dict[str, Any],
        post_id: str,
        data: CommentCreate,
    ) -> CommentResponse:
        """Add a comment to a post."""
        oid = _resolve_oid(post_id, "post")
        post = await db[POSTS_COLLECTION].find_one({"_id": oid})
        if post is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")

        now = datetime.now(timezone.utc)
        user_id_str = str(current_user["_id"])

        doc = {
            "post_id": post_id,
            "user_id": user_id_str,
            "author_name": current_user.get("name", "Student"),
            "content": data.content,
            "is_anonymous": data.is_anonymous,
            "created_at": now,
        }

        result = await db[COMMENTS_COLLECTION].insert_one(doc)
        doc["_id"] = result.inserted_id
        return _format_comment(doc, user_id_str)

    @staticmethod
    async def get_comments(
        db: AsyncDatabase,
        current_user: Dict[str, Any],
        post_id: str,
    ) -> CommentListResponse:
        """Return all comments for a post, oldest first."""
        oid = _resolve_oid(post_id, "post")
        post = await db[POSTS_COLLECTION].find_one({"_id": oid})
        if post is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")

        user_id_str = str(current_user["_id"])
        cursor = db[COMMENTS_COLLECTION].find({"post_id": post_id}).sort("created_at", 1)
        docs = await cursor.to_list(length=500)
        comments = [_format_comment(d, user_id_str) for d in docs]
        return CommentListResponse(comments=comments, total=len(comments))

    @staticmethod
    async def delete_comment(
        db: AsyncDatabase,
        current_user: Dict[str, Any],
        comment_id: str,
    ) -> Dict[str, str]:
        """Delete own comment."""
        oid = _resolve_oid(comment_id, "comment")
        user_id_str = str(current_user["_id"])

        comment = await db[COMMENTS_COLLECTION].find_one({"_id": oid})
        if comment is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found.")
        if comment.get("user_id") != user_id_str:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own comments.")

        await db[COMMENTS_COLLECTION].delete_one({"_id": oid})
        return {"message": "Comment deleted successfully."}

    # ---- Reactions / Support ----

    @staticmethod
    async def toggle_support(
        db: AsyncDatabase,
        current_user: Dict[str, Any],
        post_id: str,
    ) -> SupportResponse:
        """Toggle support reaction for a post (add if absent, remove if present)."""
        oid = _resolve_oid(post_id, "post")
        post = await db[POSTS_COLLECTION].find_one({"_id": oid})
        if post is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")

        user_id_str = str(current_user["_id"])

        existing = await db[REACTIONS_COLLECTION].find_one(
            {"post_id": post_id, "user_id": user_id_str}
        )

        if existing:
            await db[REACTIONS_COLLECTION].delete_one({"_id": existing["_id"]})
            has_supported = False
            message = "Support removed."
        else:
            await db[REACTIONS_COLLECTION].insert_one(
                {
                    "post_id": post_id,
                    "user_id": user_id_str,
                    "created_at": datetime.now(timezone.utc),
                }
            )
            has_supported = True
            message = "Support added."

        support_count = await db[REACTIONS_COLLECTION].count_documents({"post_id": post_id})
        return SupportResponse(
            post_id=post_id,
            support_count=support_count,
            has_supported=has_supported,
            message=message,
        )
