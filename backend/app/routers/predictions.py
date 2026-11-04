import logging
from typing import Any, Dict
from fastapi import APIRouter, Depends, Query, status
from pymongo.asynchronous.database import AsyncDatabase

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.prediction import StudentDataInput
from app.schemas.prediction_record import (
    PredictionCreateResponse,
    PredictionHistoryResponse,
    PredictionRecord,
)
from app.services.user_prediction_service import UserPredictionService

logger = logging.getLogger("mentalwell.predictions_router")

router = APIRouter(prefix="/predictions", tags=["Predictions"])


@router.post(
    "",
    response_model=PredictionCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Run Authenticated Mental Health Assessment",
    description=(
        "Accepts the complete lifestyle input, runs the trained ML pipeline, "
        "persists the result in MongoDB linked to the authenticated user, and "
        "returns the prediction ID, score, category and timestamp. "
        "User identity is derived exclusively from the verified JWT — "
        "no user_id should be supplied in the request body."
    ),
)
async def create_prediction(
    data: StudentDataInput,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
) -> PredictionCreateResponse:
    """Submit an assessment and persist the ML prediction result."""
    return await UserPredictionService.create_prediction(db, current_user, data)


@router.get(
    "",
    response_model=PredictionHistoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Authenticated User's Prediction History",
    description=(
        "Returns only the logged-in user's prediction history, sorted newest first. "
        "Supports pagination via limit and offset query parameters."
    ),
)
async def list_predictions(
    limit: int = Query(default=20, ge=1, le=100, description="Number of records to return"),
    offset: int = Query(default=0, ge=0, description="Number of records to skip"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
) -> PredictionHistoryResponse:
    """Retrieve the authenticated user's assessment history with pagination."""
    return await UserPredictionService.get_user_predictions(db, current_user, limit=limit, offset=offset)


@router.get(
    "/{prediction_id}",
    response_model=PredictionRecord,
    status_code=status.HTTP_200_OK,
    summary="Get Single Prediction by ID",
    description=(
        "Returns the requested prediction only if it belongs to the authenticated user. "
        "Returns 404 if the record does not exist or belongs to another user — "
        "ownership status is never disclosed."
    ),
)
async def get_prediction(
    prediction_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
) -> PredictionRecord:
    """Retrieve a single prediction record owned by the authenticated user."""
    return await UserPredictionService.get_prediction_by_id(db, current_user, prediction_id)
