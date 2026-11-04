import logging
from typing import Any, Dict
from fastapi import APIRouter, Depends, Query, status
from pymongo.asynchronous.database import AsyncDatabase

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.chat import (
    ChatSessionDetailResponse,
    ChatSessionsListResponse,
    DeleteSessionResponse,
    SendMessageRequest,
    SendMessageResponse,
)
from app.services.chat_service import ChatService

logger = logging.getLogger("mentalwell.routers.chat")

router = APIRouter(prefix="/chat", tags=["AI Wellness Chat"])


@router.post(
    "/message",
    response_model=SendMessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Send a message to the AI Wellness Companion",
    description=(
        "Processes a user message, calls Google Gemini AI with empathetic wellness guidance, "
        "and persists the conversation in MongoDB chat_sessions. "
        "If session_id is omitted, a new conversation session is created automatically."
    ),
)
async def send_chat_message(
    payload: SendMessageRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    """Send message to AI companion and return assistant response."""
    return await ChatService.send_message(db=db, current_user=current_user, data=payload)


@router.get(
    "/sessions",
    response_model=ChatSessionsListResponse,
    summary="List authenticated user's chat sessions",
    description="Returns a paginated list of chat conversation sessions owned by the authenticated user, sorted newest first.",
)
async def list_chat_sessions(
    limit: int = Query(default=20, ge=1, le=100, description="Max sessions to return"),
    offset: int = Query(default=0, ge=0, description="Offset for pagination"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    """Retrieve user's chat sessions history."""
    return await ChatService.get_user_sessions(
        db=db,
        current_user=current_user,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/sessions/{session_id}",
    response_model=ChatSessionDetailResponse,
    summary="Get conversation history for a chat session",
    description=(
        "Retrieves the full message history for a specific chat session. "
        "Enforces strict ownership: returns 404 if the session does not exist or belongs to another user."
    ),
)
async def get_chat_session(
    session_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    """Get full chat session by ID."""
    return await ChatService.get_session_by_id(
        db=db,
        current_user=current_user,
        session_id=session_id,
    )


@router.delete(
    "/sessions/{session_id}",
    response_model=DeleteSessionResponse,
    summary="Delete a chat session",
    description=(
        "Permanently deletes a chat session owned by the authenticated user. "
        "Returns 404 if the session does not exist or belongs to another user."
    ),
)
async def delete_chat_session(
    session_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    """Delete a chat session."""
    return await ChatService.delete_session(
        db=db,
        current_user=current_user,
        session_id=session_id,
    )
