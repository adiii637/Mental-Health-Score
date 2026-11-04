import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from pymongo.asynchronous.database import AsyncDatabase

from app.core.config import settings
from app.schemas.chat import (
    ChatMessage,
    ChatSessionDetailResponse,
    ChatSessionSummaryResponse,
    ChatSessionsListResponse,
    DeleteSessionResponse,
    SendMessageRequest,
    SendMessageResponse,
)

logger = logging.getLogger("mentalwell.chat_service")

# System instruction template enforcing safety and persona rules
BASE_SYSTEM_INSTRUCTION = """You are "MentalWell Assistant", a friendly, empathetic, non-judgmental wellness companion created for students using the MentalWell platform.

YOUR ROLE & TONE:
- Listen actively and respond with warmth, understanding, and compassion.
- Help students reflect on emotions, stress, sleep routines, study balance, and daily habits.
- Suggest practical, gentle, actionable wellness activities (e.g., 4-7-8 breathing, progressive muscle relaxation, journaling, taking brief screen breaks, walking outdoors, setting small study milestones).
- Encourage healthy routines and reaching out to trusted friends, family, mentors, or counselors.
- Ask relevant, thoughtful follow-up questions to understand their situation better.
- Keep responses natural, concise, and conversational. Avoid sounding overly clinical, robotic, or excessively formal.
- Use readable formatting with short paragraphs, clear bullet points, or bold highlights when sharing tips.

CRITICAL SAFETY & MEDICAL CONSTRAINTS:
1. You are a conversational WELLNESS ASSISTANT, NOT a doctor, psychiatrist, psychologist, therapist, or emergency medical service.
2. NEVER diagnose depression, anxiety, PTSD, ADHD, or any other mental health or medical condition.
3. NEVER prescribe medications or suggest altering or stopping any prescribed medical treatment.
4. MentalWell predicts an exploratory "Mental Health Score" from student lifestyle habits (sleep, study, screen time, physical activity). You must NEVER claim that this score is a medical or clinical diagnosis. It is merely a statistical dataset-based wellness estimate.
5. Do NOT make unsupported medical or psychiatric claims.
6. If a user expresses suicidal thoughts, self-harm intentions, feelings of extreme hopelessness, or immediate danger:
   - Immediately express heartfelt empathy and concern.
   - Do NOT suggest regular wellness exercises (such as breathing techniques or drinking tea) as solutions for crisis situations.
   - Strongly urge them to contact immediate professional help or emergency services right away:
     * In the US / Canada: Call or text 988 (Suicide & Crisis Lifeline, free & confidential 24/7).
     * In the UK: Call 111 or 999, or text SHOUT to 85258.
     * In India: Tele-MANAS at 14416 or 1800-891-4416 (toll-free 24/7), or call 112.
     * International: Contact local emergency services or visit the nearest hospital emergency room.
     * Reach out to a trusted family member, professor, campus counselor, or friend immediately.
7. Do not shame, judge, dismiss, or minimize the user's feelings.
8. Do not make false promises of absolute confidentiality beyond MentalWell's normal privacy protections.
"""


class ChatService:
    """
    Manages Gemini AI wellness interactions and MongoDB chat history persistence.

    Security & Privacy Rules:
    - User identity is strictly derived from the verified JWT (current_user['_id']).
    - Session ownership is enforced at the database query level on every operation.
    - No passwords, emails, JWTs, or user IDs are ever sent to the Gemini API.
    - Gemini API keys are never leaked in responses or logs.
    """

    @classmethod
    def _build_system_instruction(cls, latest_prediction: Optional[Dict[str, Any]]) -> str:
        """
        Construct system instruction with optional personalized context from the user's latest assessment.
        """
        instruction = BASE_SYSTEM_INSTRUCTION

        if latest_prediction:
            score = latest_prediction.get("predicted_mental_health_score")
            category = latest_prediction.get("score_category")
            features = latest_prediction.get("input_features", {})

            context_lines = [
                "\n\nUSER'S WELLNESS ASSESSMENT CONTEXT (For your awareness):",
                f"- Latest estimated wellness score: {score:.1f}/100" if isinstance(score, (int, float)) else None,
                f"- Score category: {category}" if category else None,
            ]

            if features:
                sleep = features.get("sleep_hours_per_night")
                study = features.get("study_hours")
                stress = features.get("stress_level")
                activity = features.get("physical_activity_hours")

                if sleep is not None:
                    context_lines.append(f"- Self-reported sleep: {sleep} hours/night")
                if study is not None:
                    context_lines.append(f"- Self-reported study time: {study} hours/day")
                if stress is not None:
                    context_lines.append(f"- Self-reported stress level: {stress}")
                if activity is not None:
                    context_lines.append(f"- Physical activity: {activity} hours/day")

            context_lines.extend([
                "- REMINDER: This score is an exploratory lifestyle estimate from student data, NOT a clinical diagnosis.",
                "- Only bring up these habits or scores if relevant to the user's message or if they ask.",
            ])

            valid_lines = [line for line in context_lines if line is not None]
            instruction += "\n".join(valid_lines)

        return instruction

    @classmethod
    async def _call_gemini_api(
        cls,
        history: List[ChatMessage],
        new_user_message: str,
        system_instruction: str,
    ) -> str:
        """
        Execute call to the official Google Gen AI SDK.
        Handles missing keys, timeouts, and API exceptions gracefully.
        """
        api_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""
        if not api_key:
            logger.warning("Gemini API key is not configured in backend environment.")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Gemini API key is not configured. Please add GEMINI_API_KEY to your backend "
                    ".env file to enable the AI Wellness Assistant."
                ),
            )

        try:
            from google import genai
            from google.genai import types
            from google.genai.errors import APIError
        except ImportError as e:
            logger.error("google-genai package is not installed: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI service dependency missing on server.",
            )

        # Initialize official Gen AI client
        client = genai.Client(api_key=api_key)

        # Prepare conversation contents (limit to last 20 messages for prompt efficiency)
        recent_history = history[-20:] if len(history) > 20 else history
        contents: List[types.Content] = []

        for msg in recent_history:
            role = "user" if msg.role == "user" else "model"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg.content)],
                )
            )

        # Append current user prompt
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=new_user_message)],
            )
        )

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.7,
        )

        model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
        timeout_seconds = max(5, settings.GEMINI_TIMEOUT_SECONDS)

        try:
            logger.info("Calling Gemini API with model '%s' (timeout=%ds)...", model_name, timeout_seconds)
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config,
                ),
                timeout=float(timeout_seconds),
            )

            assistant_text = response.text
            if not assistant_text:
                assistant_text = "I'm listening and here to support you. How are you feeling right now?"

            return assistant_text.strip()

        except asyncio.TimeoutError:
            logger.error("Gemini API call timed out after %s seconds.", timeout_seconds)
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="The AI assistant request timed out. Please try sending your message again.",
            )
        except APIError as api_err:
            err_msg = str(api_err)
            logger.error("Gemini API Error: %s", err_msg)
            # Detect invalid API key
            if "API key not valid" in err_msg or "INVALID_ARGUMENT" in err_msg or getattr(api_err, "code", None) == 400:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="The configured Gemini API key is invalid. Please check your GEMINI_API_KEY in backend/.env.",
                )
            if "RESOURCE_EXHAUSTED" in err_msg or getattr(api_err, "code", None) == 429:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Gemini API rate limit reached. Please wait a moment and try again.",
                )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to contact the AI service at this time. Please try again shortly.",
            )
        except Exception as exc:
            logger.error("Unexpected error in Gemini service: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI assistant service encountered an unexpected error. Please try again.",
            )

    @classmethod
    async def send_message(
        cls,
        db: AsyncDatabase,
        current_user: Dict[str, Any],
        data: SendMessageRequest,
    ) -> SendMessageResponse:
        """
        Send a message, persist it to chat_sessions, invoke Gemini AI, and save the AI response.
        """
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable.",
            )

        user_oid = current_user["_id"]
        now = datetime.now(timezone.utc)
        clean_user_message = data.message.strip()

        # 1. Resolve or create chat session
        session_doc: Optional[Dict[str, Any]] = None
        session_oid: Optional[ObjectId] = None
        is_new_session = False

        if data.session_id:
            try:
                session_oid = ObjectId(data.session_id)
            except (InvalidId, ValueError, TypeError):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Chat session not found.",
                )

            session_doc = await db.chat_sessions.find_one({"_id": session_oid, "user_id": user_oid})
            if session_doc is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Chat session not found.",
                )
        else:
            is_new_session = True
            # Generate friendly title from user prompt (up to 40 chars)
            title_text = clean_user_message.replace("\n", " ").strip()
            if len(title_text) > 40:
                title = title_text[:40].rstrip() + "…"
            else:
                title = title_text or "Wellness Chat"

            new_session_doc = {
                "user_id": user_oid,
                "title": title,
                "messages": [],
                "created_at": now,
                "updated_at": now,
            }
            res = await db.chat_sessions.insert_one(new_session_doc)
            session_oid = res.inserted_id
            session_doc = new_session_doc
            session_doc["_id"] = session_oid

        # 2. Existing messages in session
        existing_raw_messages = session_doc.get("messages", [])
        history: List[ChatMessage] = []
        for m in existing_raw_messages:
            try:
                history.append(
                    ChatMessage(
                        role=m.get("role", "user"),
                        content=m.get("content", ""),
                        timestamp=m.get("timestamp") or now,
                    )
                )
            except Exception:
                pass

        # 3. Retrieve user's latest prediction for personalized non-diagnostic context
        latest_prediction = await db.predictions.find_one(
            {"user_id": user_oid},
            sort=[("created_at", -1)],
        )

        system_instruction = cls._build_system_instruction(latest_prediction)

        # 4. Invoke Gemini AI
        user_message_obj = ChatMessage(
            role="user",
            content=clean_user_message,
            timestamp=now,
        )

        assistant_reply_text = await cls._call_gemini_api(
            history=history,
            new_user_message=clean_user_message,
            system_instruction=system_instruction,
        )

        assistant_message_obj = ChatMessage(
            role="assistant",
            content=assistant_reply_text,
            timestamp=datetime.now(timezone.utc),
        )

        # 5. Persist both messages to MongoDB
        update_fields: Dict[str, Any] = {
            "updated_at": assistant_message_obj.timestamp,
        }

        # If title was default or single word and this is first user message, update title
        if is_new_session:
            update_fields["title"] = session_doc.get("title", "Wellness Conversation")

        await db.chat_sessions.update_one(
            {"_id": session_oid, "user_id": user_oid},
            {
                "$push": {
                    "messages": {
                        "$each": [
                            user_message_obj.model_dump(),
                            assistant_message_obj.model_dump(),
                        ]
                    }
                },
                "$set": update_fields,
            },
        )

        return SendMessageResponse(
            session_id=str(session_oid),
            title=session_doc.get("title", "Wellness Conversation"),
            user_message=user_message_obj,
            assistant_message=assistant_message_obj,
            created_at=session_doc.get("created_at", now),
            updated_at=assistant_message_obj.timestamp,
        )

    @classmethod
    async def get_user_sessions(
        cls,
        db: AsyncDatabase,
        current_user: Dict[str, Any],
        limit: int = 20,
        offset: int = 0,
    ) -> ChatSessionsListResponse:
        """
        List chat sessions owned by the authenticated user, sorted newest first.
        """
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable.",
            )

        user_oid = current_user["_id"]
        query = {"user_id": user_oid}

        try:
            total = await db.chat_sessions.count_documents(query)
            cursor = (
                db.chat_sessions.find(query)
                .sort("updated_at", -1)
                .skip(offset)
                .limit(limit)
            )
            docs = await cursor.to_list(length=limit)

            summaries: List[ChatSessionSummaryResponse] = []
            for doc in docs:
                messages = doc.get("messages", [])
                last_msg_snippet: Optional[str] = None
                if messages:
                    last_content = messages[-1].get("content", "")
                    last_msg_snippet = (
                        last_content[:80] + "…" if len(last_content) > 80 else last_content
                    )

                summaries.append(
                    ChatSessionSummaryResponse(
                        id=str(doc["_id"]),
                        title=doc.get("title", "Conversation"),
                        message_count=len(messages),
                        last_message=last_msg_snippet,
                        created_at=doc.get("created_at", datetime.now(timezone.utc)),
                        updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
                    )
                )

            return ChatSessionsListResponse(
                sessions=summaries,
                total=total,
                limit=limit,
                offset=offset,
            )
        except HTTPException:
            raise
        except Exception as exc:
            logger.error("Error retrieving user chat sessions: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not retrieve chat sessions.",
            )

    @classmethod
    async def get_session_by_id(
        cls,
        db: AsyncDatabase,
        current_user: Dict[str, Any],
        session_id: str,
    ) -> ChatSessionDetailResponse:
        """
        Retrieve complete message history for a specific chat session.
        Enforces user ownership: returns 404 if not found or belongs to another user.
        """
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable.",
            )

        try:
            session_oid = ObjectId(session_id)
        except (InvalidId, ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found.",
            )

        user_oid = current_user["_id"]

        doc = await db.chat_sessions.find_one({"_id": session_oid, "user_id": user_oid})
        if doc is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found.",
            )

        messages = [
            ChatMessage(
                role=m.get("role", "user"),
                content=m.get("content", ""),
                timestamp=m.get("timestamp", doc.get("created_at")),
            )
            for m in doc.get("messages", [])
        ]

        return ChatSessionDetailResponse(
            id=str(doc["_id"]),
            title=doc.get("title", "Conversation"),
            messages=messages,
            created_at=doc.get("created_at", datetime.now(timezone.utc)),
            updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
        )

    @classmethod
    async def delete_session(
        cls,
        db: AsyncDatabase,
        current_user: Dict[str, Any],
        session_id: str,
    ) -> DeleteSessionResponse:
        """
        Permanently delete a chat session owned by the authenticated user.
        """
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable.",
            )

        try:
            session_oid = ObjectId(session_id)
        except (InvalidId, ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found.",
            )

        user_oid = current_user["_id"]

        result = await db.chat_sessions.delete_one({"_id": session_oid, "user_id": user_oid})
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found.",
            )

        logger.info("Chat session %s deleted by user %s", session_id, str(user_oid))
        return DeleteSessionResponse(
            message="Chat session deleted successfully.",
            id=session_id,
        )
