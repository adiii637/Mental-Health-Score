import logging
from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from pymongo.asynchronous.database import AsyncDatabase

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services.auth_service import AuthService
from app.schemas.user import (
    UserRegisterRequest,
    UserLoginRequest,
    UserUpdateRequest,
    UserPublic,
    TokenResponse,
)

logger = logging.getLogger("mentalwell.auth_router")

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Register New User Account",
    description="Registers a new user with name, email, and Argon2-hashed password. Rejects duplicate emails.",
)
async def register(
    data: UserRegisterRequest,
    db: AsyncDatabase = Depends(get_db),
) -> UserPublic:
    """Register a new user account and return safe profile information."""
    return await AuthService.register(db, data)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User Login",
    description="Authenticates credentials and returns a signed JWT Bearer access token.",
)
async def login(
    data: UserLoginRequest,
    db: AsyncDatabase = Depends(get_db),
) -> TokenResponse:
    """Verify user credentials and return an access token."""
    return await AuthService.login(db, data)


@router.get(
    "/me",
    response_model=UserPublic,
    status_code=status.HTTP_200_OK,
    summary="Get Current User Profile",
    description="Returns the profile of the authenticated user identified by the Bearer token.",
)
async def get_me(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> UserPublic:
    """Retrieve authenticated user's profile."""
    return AuthService.format_user_public(current_user)


@router.patch(
    "/me",
    response_model=UserPublic,
    status_code=status.HTTP_200_OK,
    summary="Update Profile",
    description="Updates the authenticated user's name and refreshes updated_at. Email and password cannot be changed here.",
)
async def update_me(
    data: UserUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
) -> UserPublic:
    """Update authenticated user's profile attributes."""
    return await AuthService.update_profile(db, current_user, data)
