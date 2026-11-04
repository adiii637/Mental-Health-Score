import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from bson import ObjectId
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.core.database import DatabaseManager
from app.core.security import create_access_token
from app.main import app


@pytest.fixture(scope="session", autouse=True)
async def setup_db():
    """Ensure database connection is established for testing on the session event loop."""
    await DatabaseManager.disconnect()
    await DatabaseManager.connect()
    yield
    await DatabaseManager.disconnect()


@pytest.fixture
async def test_users():
    """Create two test users in MongoDB and generate valid JWT tokens."""
    db = DatabaseManager.get_database()
    assert db is not None, "MongoDB must be running for integration tests"

    user_a_id = ObjectId()
    user_b_id = ObjectId()

    user_a_doc = {
        "_id": user_a_id,
        "name": "Alice Student",
        "email": f"alice_{user_a_id}@example.com",
        "hashed_password": "hashed_secret_password_for_alice",
        "created_at": datetime.now(timezone.utc),
    }
    user_b_doc = {
        "_id": user_b_id,
        "name": "Bob Student",
        "email": f"bob_{user_b_id}@example.com",
        "hashed_password": "hashed_secret_password_for_bob",
        "created_at": datetime.now(timezone.utc),
    }

    await db.users.insert_one(user_a_doc)
    await db.users.insert_one(user_b_doc)

    token_a = create_access_token(subject=str(user_a_id))
    token_b = create_access_token(subject=str(user_b_id))

    yield {
        "user_a": {"id": str(user_a_id), "oid": user_a_id, "token": token_a, "doc": user_a_doc},
        "user_b": {"id": str(user_b_id), "oid": user_b_id, "token": token_b, "doc": user_b_doc},
    }

    # Cleanup test users and their chat sessions
    await db.users.delete_many({"_id": {"$in": [user_a_id, user_b_id]}})
    await db.chat_sessions.delete_many({"user_id": {"$in": [user_a_id, user_b_id]}})
    await db.predictions.delete_many({"user_id": {"$in": [user_a_id, user_b_id]}})


@pytest.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.mark.asyncio
async def test_unauthenticated_access(async_client: AsyncClient):
    """Verify all chat endpoints require valid JWT authentication."""
    # 1. POST /message
    res = await async_client.post("/api/v1/chat/message", json={"message": "Hello"})
    assert res.status_code == 401

    # 2. GET /sessions
    res = await async_client.get("/api/v1/chat/sessions")
    assert res.status_code == 401

    # 3. GET /sessions/{id}
    res = await async_client.get(f"/api/v1/chat/sessions/{ObjectId()}")
    assert res.status_code == 401

    # 4. DELETE /sessions/{id}
    res = await async_client.delete(f"/api/v1/chat/sessions/{ObjectId()}")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_message_validation(async_client: AsyncClient, test_users):
    """Verify empty, whitespace, and excessively long messages are rejected with 422."""
    headers = {"Authorization": f"Bearer {test_users['user_a']['token']}"}

    # Empty message
    res = await async_client.post("/api/v1/chat/message", json={"message": ""}, headers=headers)
    assert res.status_code == 422

    # Whitespace only
    res = await async_client.post("/api/v1/chat/message", json={"message": "    "}, headers=headers)
    assert res.status_code == 422

    # Too long (over 5000 characters)
    res = await async_client.post("/api/v1/chat/message", json={"message": "a" * 5001}, headers=headers)
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_invalid_session_id_format(async_client: AsyncClient, test_users):
    """Verify non-ObjectId session IDs return 404."""
    headers = {"Authorization": f"Bearer {test_users['user_a']['token']}"}

    res = await async_client.post(
        "/api/v1/chat/message",
        json={"message": "Hello", "session_id": "invalid-id-format"},
        headers=headers,
    )
    assert res.status_code == 404

    res = await async_client.get("/api/v1/chat/sessions/invalid-id-format", headers=headers)
    assert res.status_code == 404

    res = await async_client.delete("/api/v1/chat/sessions/invalid-id-format", headers=headers)
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_missing_gemini_api_key_error(async_client: AsyncClient, test_users):
    """When GEMINI_API_KEY is unset or empty, service returns 503 with helpful config guidance."""
    headers = {"Authorization": f"Bearer {test_users['user_a']['token']}"}

    with patch.object(settings, "GEMINI_API_KEY", ""):
        res = await async_client.post(
            "/api/v1/chat/message",
            json={"message": "I am feeling stressed."},
            headers=headers,
        )
        assert res.status_code == 503
        data = res.json()
        assert "GEMINI_API_KEY" in data["detail"]


@pytest.mark.asyncio
async def test_invalid_gemini_api_key_handling(async_client: AsyncClient, test_users):
    """When Gemini API rejects the request due to an invalid key, returns 502 with clear message."""
    from google.genai.errors import ClientError

    headers = {"Authorization": f"Bearer {test_users['user_a']['token']}"}

    fake_client_error = ClientError(400, {"error": {"message": "API key not valid. Please pass a valid API key."}})

    with patch.object(settings, "GEMINI_API_KEY", "bad_fake_api_key_12345"):
        with patch("google.genai.Client") as mock_genai_cls:
            mock_instance = MagicMock()
            mock_instance.aio.models.generate_content = AsyncMock(side_effect=fake_client_error)
            mock_genai_cls.return_value = mock_instance

            res = await async_client.post(
                "/api/v1/chat/message",
                json={"message": "Hello assistant"},
                headers=headers,
            )
            assert res.status_code == 502
            data = res.json()
            assert "invalid" in data["detail"].lower()
            # Verify secret key is NOT leaked in detail
            assert "bad_fake_api_key_12345" not in data["detail"]


@pytest.mark.asyncio
async def test_gemini_timeout_handling(async_client: AsyncClient, test_users):
    """When Gemini call exceeds the timeout, returns 504 Gateway Timeout."""
    headers = {"Authorization": f"Bearer {test_users['user_a']['token']}"}

    with patch.object(settings, "GEMINI_API_KEY", "valid_looking_key"):
        with patch.object(settings, "GEMINI_TIMEOUT_SECONDS", 1):
            with patch("google.genai.Client") as mock_genai_cls:
                async def slow_generate(*args, **kwargs):
                    await asyncio.sleep(5)
                    return MagicMock(text="Finished")

                mock_instance = MagicMock()
                mock_instance.aio.models.generate_content = slow_generate
                mock_genai_cls.return_value = mock_instance

                res = await async_client.post(
                    "/api/v1/chat/message",
                    json={"message": "Can you help me?"},
                    headers=headers,
                )
                assert res.status_code == 504
                assert "timed out" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_successful_message_flow_and_session_persistence(async_client: AsyncClient, test_users):
    """Test full conversational flow: creating a new session, persisting messages, and subsequent replies."""
    headers = {"Authorization": f"Bearer {test_users['user_a']['token']}"}
    db = DatabaseManager.get_database()

    mock_gemini_response = MagicMock(
        text="I understand that exams can be overwhelming. Let's take a deep breath together. Have you taken any breaks today?"
    )

    with patch.object(settings, "GEMINI_API_KEY", "mock_valid_key"):
        with patch("google.genai.Client") as mock_genai_cls:
            mock_instance = MagicMock()
            mock_instance.aio.models.generate_content = AsyncMock(return_value=mock_gemini_response)
            mock_genai_cls.return_value = mock_instance

            # 1. Send first message (creates session automatically)
            res1 = await async_client.post(
                "/api/v1/chat/message",
                json={"message": "I feel overwhelmed with exam preparations."},
                headers=headers,
            )
            assert res1.status_code == 200
            data1 = res1.json()
            assert "session_id" in data1
            session_id = data1["session_id"]
            assert data1["title"].startswith("I feel overwhelmed with exam preparation")
            assert data1["user_message"]["content"] == "I feel overwhelmed with exam preparations."
            assert data1["assistant_message"]["content"] == mock_gemini_response.text

            # 2. Check session in MongoDB
            session_doc = await db.chat_sessions.find_one({"_id": ObjectId(session_id)})
            assert session_doc is not None
            assert str(session_doc["user_id"]) == test_users["user_a"]["id"]
            assert len(session_doc["messages"]) == 2

            # 3. Send second message in same session
            mock_gemini_response_2 = MagicMock(
                text="A 15-minute walk sounds great. Physical movement helps clear your head."
            )
            mock_instance.aio.models.generate_content = AsyncMock(return_value=mock_gemini_response_2)

            res2 = await async_client.post(
                "/api/v1/chat/message",
                json={"message": "I think I will go for a 15-minute walk.", "session_id": session_id},
                headers=headers,
            )
            assert res2.status_code == 200
            data2 = res2.json()
            assert data2["session_id"] == session_id
            assert data2["assistant_message"]["content"] == mock_gemini_response_2.text

            # 4. Verify MongoDB now has 4 messages
            session_doc_after = await db.chat_sessions.find_one({"_id": ObjectId(session_id)})
            assert len(session_doc_after["messages"]) == 4


@pytest.mark.asyncio
async def test_personalization_context_and_safety_prompt(async_client: AsyncClient, test_users):
    """Verify user's latest prediction is included as safe non-diagnostic context in system instruction."""
    headers = {"Authorization": f"Bearer {test_users['user_a']['token']}"}
    db = DatabaseManager.get_database()

    # Insert a prior prediction for user A
    user_a_oid = test_users["user_a"]["oid"]
    await db.predictions.insert_one({
        "user_id": user_a_oid,
        "input_features": {
            "sleep_hours_per_night": 5.5,
            "study_hours": 6.0,
            "stress_level": "High",
            "physical_activity_hours": 0.5,
        },
        "predicted_mental_health_score": 48.5,
        "score_category": "Strained",
        "created_at": datetime.now(timezone.utc),
    })

    captured_config = {}

    async def mock_generate(model, contents, config):
        captured_config["instruction"] = config.system_instruction
        return MagicMock(text="I'm here to support your sleep and focus.")

    with patch.object(settings, "GEMINI_API_KEY", "mock_key"):
        with patch("google.genai.Client") as mock_genai_cls:
            mock_instance = MagicMock()
            mock_instance.aio.models.generate_content = mock_generate
            mock_genai_cls.return_value = mock_instance

            res = await async_client.post(
                "/api/v1/chat/message",
                json={"message": "How can I improve my sleep?"},
                headers=headers,
            )
            assert res.status_code == 200

            system_instruction = captured_config.get("instruction", "")
            # Verify personalization context is present
            assert "48.5/100" in system_instruction
            assert "Strained" in system_instruction
            assert "5.5 hours/night" in system_instruction
            assert "High" in system_instruction
            # Verify safety rules are present
            assert "NOT a doctor" in system_instruction
            assert "NEVER diagnose" in system_instruction
            assert "988" in system_instruction
            # Verify NO sensitive personal data leaked into prompt
            assert test_users["user_a"]["doc"]["email"] not in system_instruction
            assert "hashed_password" not in system_instruction
            assert str(user_a_oid) not in system_instruction


@pytest.mark.asyncio
async def test_session_listing_and_retrieval(async_client: AsyncClient, test_users):
    """Verify session pagination and full detail retrieval."""
    headers = {"Authorization": f"Bearer {test_users['user_a']['token']}"}
    db = DatabaseManager.get_database()
    user_a_oid = test_users["user_a"]["oid"]

    # Pre-create two sessions for user A
    now = datetime.now(timezone.utc)
    res_s1 = await db.chat_sessions.insert_one({
        "user_id": user_a_oid,
        "title": "Study Routine Chat",
        "messages": [
            {"role": "user", "content": "How do I study better?", "timestamp": now},
            {"role": "assistant", "content": "Try the Pomodoro technique.", "timestamp": now},
        ],
        "created_at": now,
        "updated_at": now,
    })
    s1_id = str(res_s1.inserted_id)

    # 1. List sessions
    res = await async_client.get("/api/v1/chat/sessions", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    session_ids = [s["id"] for s in data["sessions"]]
    assert s1_id in session_ids

    # 2. Get specific session
    res_detail = await async_client.get(f"/api/v1/chat/sessions/{s1_id}", headers=headers)
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["id"] == s1_id
    assert detail["title"] == "Study Routine Chat"
    assert len(detail["messages"]) == 2
    assert detail["messages"][0]["role"] == "user"


@pytest.mark.asyncio
async def test_cross_user_isolation(async_client: AsyncClient, test_users):
    """Strictly verify User B cannot view, delete, or append to User A's session."""
    headers_a = {"Authorization": f"Bearer {test_users['user_a']['token']}"}
    headers_b = {"Authorization": f"Bearer {test_users['user_b']['token']}"}
    db = DatabaseManager.get_database()

    # User A creates a session
    now = datetime.now(timezone.utc)
    res_s = await db.chat_sessions.insert_one({
        "user_id": test_users["user_a"]["oid"],
        "title": "Alice's Secret Wellness Conversation",
        "messages": [
            {"role": "user", "content": "Private thoughts.", "timestamp": now},
            {"role": "assistant", "content": "Understood.", "timestamp": now},
        ],
        "created_at": now,
        "updated_at": now,
    })
    alice_session_id = str(res_s.inserted_id)

    # User B attempts to read Alice's session -> must return 404 (not 403, preventing ID enumeration)
    res_get = await async_client.get(f"/api/v1/chat/sessions/{alice_session_id}", headers=headers_b)
    assert res_get.status_code == 404

    # User B attempts to delete Alice's session -> must return 404
    res_del = await async_client.delete(f"/api/v1/chat/sessions/{alice_session_id}", headers=headers_b)
    assert res_del.status_code == 404

    # User B attempts to send message to Alice's session -> must return 404
    with patch.object(settings, "GEMINI_API_KEY", "mock_key"):
        res_send = await async_client.post(
            "/api/v1/chat/message",
            json={"message": "Infiltrating", "session_id": alice_session_id},
            headers=headers_b,
        )
        assert res_send.status_code == 404

    # Verify Alice's session was unaffected
    doc_check = await db.chat_sessions.find_one({"_id": ObjectId(alice_session_id)})
    assert doc_check is not None
    assert len(doc_check["messages"]) == 2


@pytest.mark.asyncio
async def test_session_deletion(async_client: AsyncClient, test_users):
    """Verify owner can successfully delete their chat session."""
    headers = {"Authorization": f"Bearer {test_users['user_a']['token']}"}
    db = DatabaseManager.get_database()

    now = datetime.now(timezone.utc)
    res_s = await db.chat_sessions.insert_one({
        "user_id": test_users["user_a"]["oid"],
        "title": "Session to be deleted",
        "messages": [],
        "created_at": now,
        "updated_at": now,
    })
    session_id = str(res_s.inserted_id)

    # Delete session
    res_delete = await async_client.delete(f"/api/v1/chat/sessions/{session_id}", headers=headers)
    assert res_delete.status_code == 200
    assert res_delete.json()["id"] == session_id

    # Verify subsequent GET returns 404
    res_get = await async_client.get(f"/api/v1/chat/sessions/{session_id}", headers=headers)
    assert res_get.status_code == 404

    # Verify removed from database
    doc_in_db = await db.chat_sessions.find_one({"_id": ObjectId(session_id)})
    assert doc_in_db is None
