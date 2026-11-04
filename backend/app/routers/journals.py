import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, Query, status
from pymongo.asynchronous.database import AsyncDatabase

from app.core.dependencies import get_current_user
from app.core.database import get_db
from app.schemas.journal import (
    JournalCreate,
    JournalUpdate,
    JournalResponse,
    JournalListResponse,
)
from app.services.journal_service import JournalService

logger = logging.getLogger("mentalwell.routers.journals")

router = APIRouter(prefix="/journals", tags=["Journals"])


@router.post(
    "",
    response_model=JournalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new private journal entry",
    description="Creates a mood reflection entry for the authenticated user. Timestamps are stored in UTC.",
)
async def create_journal(
    data: JournalCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    return await JournalService.create_journal(db, current_user, data)


@router.get(
    "",
    response_model=JournalListResponse,
    summary="Get paginated journal entries",
    description="Returns the authenticated user's journal entries sorted by newest first.",
)
async def get_journals(
    limit: int = Query(default=20, ge=1, le=100, description="Max entries to return"),
    offset: int = Query(default=0, ge=0, description="Number of entries to skip"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    return await JournalService.get_user_journals(db, current_user, limit=limit, offset=offset)


@router.get(
    "/{journal_id}",
    response_model=JournalResponse,
    summary="Get single journal entry by ID",
    description="Returns an authenticated user's specific journal entry. Returns 404 if not found or unowned.",
)
async def get_journal(
    journal_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    return await JournalService.get_journal_by_id(db, current_user, journal_id)


@router.patch(
    "/{journal_id}",
    response_model=JournalResponse,
    summary="Update a journal entry",
    description="Allows updating mood, title, or content of an authenticated user's journal entry.",
)
async def update_journal(
    journal_id: str,
    data: JournalUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    return await JournalService.update_journal(db, current_user, journal_id, data)


@router.delete(
    "/{journal_id}",
    summary="Delete a journal entry",
    description="Permanently deletes an authenticated user's journal entry. Returns 404 if unowned.",
)
async def delete_journal(
    journal_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    return await JournalService.delete_journal(db, current_user, journal_id)
