import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional, List, Tuple
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from pymongo.asynchronous.database import AsyncDatabase

from app.schemas.prediction import StudentDataInput, ScoreCategory
from app.schemas.prediction_record import PredictionRecord, PredictionCreateResponse, PredictionHistoryResponse
from app.services.prediction_service import PredictionService

logger = logging.getLogger("mentalwell.user_prediction_service")


class UserPredictionService:
    """
    Handles authenticated prediction creation, persistence, and retrieval.

    Security contract:
    - user_id is ALWAYS derived from the verified JWT (current_user document).
    - Never trusts a user_id from the request body.
    - Ownership is validated before returning any individual record.
    """

    @staticmethod
    def _doc_to_record(doc: Dict[str, Any]) -> PredictionRecord:
        """Convert a raw MongoDB prediction document to a PredictionRecord."""
        return PredictionRecord(
            id=str(doc["_id"]),
            user_id=str(doc["user_id"]),
            input_features=doc.get("input_features", {}),
            predicted_mental_health_score=doc["predicted_mental_health_score"],
            score_category=ScoreCategory(doc["score_category"]),
            created_at=doc["created_at"],
        )

    @classmethod
    async def create_prediction(
        cls,
        db: AsyncDatabase,
        current_user: Dict[str, Any],
        data: StudentDataInput,
    ) -> PredictionCreateResponse:
        """
        Run ML inference, save result to MongoDB, return saved record.
        user_id is extracted from the verified JWT (current_user["_id"]).
        """
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable.",
            )

        # 1. Run ML inference via existing PredictionService (no model changes)
        prediction_result = PredictionService.predict(data)

        # 2. Snapshot input features as stored (lowercase field names for consistency)
        input_snapshot = data.model_dump()

        # 3. Build document — user_id from JWT, never from request
        user_oid = current_user["_id"]  # ObjectId from DB lookup in dependency
        now = datetime.now(timezone.utc)

        prediction_doc = {
            "user_id": user_oid,
            "input_features": input_snapshot,
            "predicted_mental_health_score": prediction_result.predicted_mental_health_score,
            "score_category": prediction_result.score_category.value,
            "created_at": now,
        }

        try:
            result = await db.predictions.insert_one(prediction_doc)
            logger.info(
                "Prediction saved — id=%s user=%s score=%.2f category=%s",
                result.inserted_id,
                str(user_oid),
                prediction_result.predicted_mental_health_score,
                prediction_result.score_category.value,
            )
            return PredictionCreateResponse(
                id=str(result.inserted_id),
                predicted_mental_health_score=prediction_result.predicted_mental_health_score,
                score_category=prediction_result.score_category,
                created_at=now,
                status="success",
            )
        except Exception as exc:
            logger.error("Failed to persist prediction: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Prediction was calculated but could not be saved. Please try again.",
            )

    @classmethod
    async def get_user_predictions(
        cls,
        db: AsyncDatabase,
        current_user: Dict[str, Any],
        limit: int = 20,
        offset: int = 0,
    ) -> PredictionHistoryResponse:
        """
        Return the authenticated user's prediction history (newest first).
        Ownership enforced by filtering on user_id from JWT.
        """
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable.",
            )

        user_oid = current_user["_id"]
        query = {"user_id": user_oid}

        try:
            total = await db.predictions.count_documents(query)
            cursor = (
                db.predictions.find(query)
                .sort("created_at", -1)
                .skip(offset)
                .limit(limit)
            )
            docs = await cursor.to_list(length=limit)
            records = [cls._doc_to_record(d) for d in docs]

            return PredictionHistoryResponse(
                predictions=records,
                total=total,
                limit=limit,
                offset=offset,
            )
        except HTTPException:
            raise
        except Exception as exc:
            logger.error("Failed to fetch prediction history: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not retrieve prediction history.",
            )

    @classmethod
    async def get_prediction_by_id(
        cls,
        db: AsyncDatabase,
        current_user: Dict[str, Any],
        prediction_id: str,
    ) -> PredictionRecord:
        """
        Return a single prediction owned by the authenticated user.
        Returns 404 if the record does not exist OR belongs to another user.
        (Never leaks ownership status — always 404, never 403, to prevent enumeration.)
        """
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable.",
            )

        try:
            pred_oid = ObjectId(prediction_id)
        except (InvalidId, ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prediction not found.",
            )

        user_oid = current_user["_id"]

        try:
            # Filter by BOTH _id and user_id — ownership enforced at DB query level
            doc = await db.predictions.find_one({"_id": pred_oid, "user_id": user_oid})
        except Exception as exc:
            logger.error("DB error fetching prediction %s: %s", prediction_id, exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not retrieve the prediction.",
            )

        if doc is None:
            # 404 regardless of whether it exists but belongs to someone else
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prediction not found.",
            )

        return cls._doc_to_record(doc)
