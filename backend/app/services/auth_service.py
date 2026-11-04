import logging
from datetime import datetime, timezone
from typing import Any, Dict
from fastapi import HTTPException, status
from pymongo.asynchronous.database import AsyncDatabase
import pymongo.errors

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.user import (
    UserRegisterRequest,
    UserLoginRequest,
    UserUpdateRequest,
    UserPublic,
    TokenResponse,
)

logger = logging.getLogger("mentalwell.auth_service")


class AuthService:
    """Authentication and profile management business logic."""

    @staticmethod
    def format_user_public(user_dict: Dict[str, Any]) -> UserPublic:
        """Transform MongoDB user record to safe public representation."""
        return UserPublic(
            id=str(user_dict["_id"]),
            name=user_dict["name"],
            email=user_dict["email"],
            created_at=user_dict.get("created_at", datetime.now(timezone.utc)),
            updated_at=user_dict.get("updated_at"),
        )

    @classmethod
    async def register(cls, db: AsyncDatabase, data: UserRegisterRequest) -> UserPublic:
        """Register a new user account with an Argon2 password hash."""
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable. Please try again later.",
            )

        # Check for existing email (case-normalized)
        normalized_email = data.email.strip().lower()
        existing_user = await db.users.find_one({"email": normalized_email})
        if existing_user is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists.",
            )

        now = datetime.now(timezone.utc)
        user_doc = {
            "name": data.name.strip(),
            "email": normalized_email,
            "password_hash": hash_password(data.password),
            "created_at": now,
            "updated_at": now,
        }

        try:
            result = await db.users.insert_one(user_doc)
            user_doc["_id"] = result.inserted_id
            logger.info("New user registered successfully: %s", normalized_email)
            return cls.format_user_public(user_doc)
        except pymongo.errors.DuplicateKeyError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists.",
            )
        except Exception as exc:
            logger.error("Failed to insert new user: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Registration failed due to an internal server error.",
            )

    @classmethod
    async def login(cls, db: AsyncDatabase, data: UserLoginRequest) -> TokenResponse:
        """Verify user credentials and return a signed JWT access token."""
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable. Please try again later.",
            )

        normalized_email = data.email.strip().lower()
        user = await db.users.find_one({"email": normalized_email})

        # Generic unauthorized error for any credential mismatch to prevent enumeration
        generic_error = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

        if user is None:
            # Perform dummy hash verify to mitigate timing attacks
            verify_password("dummy_password", "$argon2id$v=19$m=65536,t=3,p=4$dummyhash")
            raise generic_error

        stored_hash = user.get("password_hash", "")
        if not verify_password(data.password, stored_hash):
            raise generic_error

        # Generate JWT access token with user _id string as subject
        user_id_str = str(user["_id"])
        access_token = create_access_token(subject=user_id_str)
        expires_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

        logger.info("User signed in successfully: %s", normalized_email)

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=expires_seconds,
            user=cls.format_user_public(user),
        )

    @classmethod
    async def update_profile(
        cls,
        db: AsyncDatabase,
        current_user: Dict[str, Any],
        data: UserUpdateRequest,
    ) -> UserPublic:
        """Update authenticated user's name and refresh updated_at."""
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable.",
            )

        now = datetime.now(timezone.utc)
        clean_name = data.name.strip()

        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": {"name": clean_name, "updated_at": now}},
        )

        current_user["name"] = clean_name
        current_user["updated_at"] = now

        logger.info("Updated profile for user: %s", current_user.get("email"))
        return cls.format_user_public(current_user)
