import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional, List
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from pymongo.asynchronous.database import AsyncDatabase

from app.schemas.journal import (
    JournalCreate,
    JournalUpdate,
    JournalResponse,
    JournalListResponse,
)

logger = logging.getLogger("mentalwell.journal_service")


class JournalService:
    """
    Handles authenticated journal entry management.

    Security & Privacy Guarantees:
    - user_id is ALWAYS derived from the verified JWT (current_user document).
    - Entries are strictly private to the authenticated author.
    - All queries filter by both document ObjectId and user_id.
    - Non-existent or unowned records return 404 to avoid enumeration.
    - All timestamps stored in UTC.
    """

    @staticmethod
    def _doc_to_response(doc: Dict[str, Any]) -> JournalResponse:
        """Convert a raw MongoDB journal document to a JournalResponse."""
        return JournalResponse(
            id=str(doc["_id"]),
            user_id=str(doc["user_id"]),
            title=doc.get("title"),
            mood=doc["mood"],
            content=doc["content"],
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    @classmethod
    async def create_journal(
        cls,
        db: AsyncDatabase,
        current_user: Dict[str, Any],
        data: JournalCreate,
    ) -> JournalResponse:
        """Create a new private journal entry for the authenticated user."""
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable.",
            )

        user_oid = current_user["_id"]
        now = datetime.now(timezone.utc)

        journal_doc = {
            "user_id": user_oid,
            "title": data.title.strip() if data.title else None,
            "mood": data.mood,
            "content": data.content.strip(),
            "created_at": now,
            "updated_at": now,
        }

        try:
            result = await db.journals.insert_one(journal_doc)
            journal_doc["_id"] = result.inserted_id
            logger.info("Journal entry created id=%s for user=%s", result.inserted_id, str(user_oid))
            return cls._doc_to_response(journal_doc)
        except Exception as exc:
            logger.error("Failed to create journal entry: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not save journal entry. Please try again.",
            )

    @classmethod
    async def get_user_journals(
        cls,
        db: AsyncDatabase,
        current_user: Dict[str, Any],
        limit: int = 20,
        offset: int = 0,
    ) -> JournalListResponse:
        """Retrieve paginated journal entries for the authenticated user (newest first)."""
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable.",
            )

        user_oid = current_user["_id"]
        query = {"user_id": user_oid}

        try:
            total = await db.journals.count_documents(query)
            cursor = (
                db.journals.find(query)
                .sort("created_at", -1)
                .skip(offset)
                .limit(limit)
            )
            docs = await cursor.to_list(length=limit)
            items = [cls._doc_to_response(d) for d in docs]

            return JournalListResponse(
                journals=items,
                total=total,
                limit=limit,
                offset=offset,
            )
        except Exception as exc:
            logger.error("Failed to fetch user journals: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not retrieve journal entries.",
            )

    @classmethod
    async def get_journal_by_id(
        cls,
        db: AsyncDatabase,
        current_user: Dict[str, Any],
        journal_id: str,
    ) -> JournalResponse:
        """
        Fetch a single journal entry owned by the authenticated user.
        Returns 404 if the record does not exist OR belongs to another user.
        """
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable.",
            )

        try:
            journal_oid = ObjectId(journal_id)
        except (InvalidId, ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Journal entry not found.",
            )

        user_oid = current_user["_id"]

        try:
            doc = await db.journals.find_one({"_id": journal_oid, "user_id": user_oid})
        except Exception as exc:
            logger.error("DB error fetching journal %s: %s", journal_id, exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not retrieve the journal entry.",
            )

        if doc is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Journal entry not found.",
            )

        return cls._doc_to_response(doc)

    @classmethod
    async def update_journal(
        cls,
        db: AsyncDatabase,
        current_user: Dict[str, Any],
        journal_id: str,
        data: JournalUpdate,
    ) -> JournalResponse:
        """
        Update a journal entry owned by the authenticated user.
        Returns 404 if not found or unowned.
        """
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable.",
            )

        try:
            journal_oid = ObjectId(journal_id)
        except (InvalidId, ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Journal entry not found.",
            )

        user_oid = current_user["_id"]

        # Ensure record exists and is owned
        existing = await db.journals.find_one({"_id": journal_oid, "user_id": user_oid})
        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Journal entry not found.",
            )

        update_fields: Dict[str, Any] = {
            "updated_at": datetime.now(timezone.utc)
        }

        if data.mood is not None:
            update_fields["mood"] = data.mood
        if data.content is not None:
            update_fields["content"] = data.content.strip()
        if data.title is not None:
            update_fields["title"] = data.title.strip() if data.title else None

        try:
            await db.journals.update_one(
                {"_id": journal_oid, "user_id": user_oid},
                {"$set": update_fields},
            )
            updated_doc = await db.journals.find_one({"_id": journal_oid, "user_id": user_oid})
            return cls._doc_to_response(updated_doc)
        except Exception as exc:
            logger.error("DB error updating journal %s: %s", journal_id, exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not update the journal entry.",
            )

    @classmethod
    async def delete_journal(
        cls,
        db: AsyncDatabase,
        current_user: Dict[str, Any],
        journal_id: str,
    ) -> Dict[str, str]:
        """
        Delete a journal entry owned by the authenticated user.
        Returns 404 if not found or unowned.
        """
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable.",
            )

        try:
            journal_oid = ObjectId(journal_id)
        except (InvalidId, ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Journal entry not found.",
            )

        user_oid = current_user["_id"]

        try:
            result = await db.journals.delete_one({"_id": journal_oid, "user_id": user_oid})
        except Exception as exc:
            logger.error("DB error deleting journal %s: %s", journal_id, exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not delete journal entry.",
            )

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Journal entry not found.",
            )

        return {"message": "Journal entry deleted successfully", "id": journal_id}
