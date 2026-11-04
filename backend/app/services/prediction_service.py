import logging
import math
import pandas as pd
from fastapi import HTTPException, status

from app.core.model_loader import ModelManager
from app.schemas.prediction import (
    StudentDataInput,
    PredictionResponse,
    ScoreCategory,
)

logger = logging.getLogger("mentalwell.prediction_service")

# Exact top countries list used during training pipeline feature engineering
TOP_COUNTRIES = [
    'Other',
    'India',
    'USA',
    'Canada',
    'Australia',
    'UK',
    'Germany',
    'Mexico',
    'Turkey',
    'France',
]


class PredictionService:
    """Service handling feature transformation, model inference, and output formatting."""

    @staticmethod
    def _categorize_score(score: float) -> ScoreCategory:
        """Map numerical score to qualitative wellness band."""
        if score < 4.0:
            return ScoreCategory.STRAINED
        elif score < 7.0:
            return ScoreCategory.BALANCED
        return ScoreCategory.STRONG

    @classmethod
    def predict(cls, data: StudentDataInput) -> PredictionResponse:
        """Execute prediction using the loaded scikit-learn pipeline."""
        model = ModelManager.get_model()

        if not ModelManager.is_loaded() or model is None:
            logger.error("Prediction requested but ML model is not loaded.")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The mental health prediction model is currently unavailable.",
            )

        try:
            # Country grouping rule matching notebook feature engineering
            cleaned_country = data.country.strip()
            grouped_country = (
                cleaned_country if cleaned_country in TOP_COUNTRIES else "Other"
            )

            # Construct DataFrame with the exact column names expected by ColumnTransformer
            input_row = pd.DataFrame([{
                'Age': data.age,
                'Gender': data.gender,
                'Country': cleaned_country,
                'Academic_Level': data.academic_level,
                'Most_Used_Platform': data.most_used_platform,
                'Purpose_Of_Use': data.purpose_of_use,
                'Avg_Daily_Usage_Hours': float(data.avg_daily_usage_hours),
                'Daily_Unlocks': int(data.daily_unlocks),
                'Study_Hours': float(data.study_hours),
                'Physical_Activity_Hours': float(data.physical_activity_hours),
                'Sleep_Hours_Per_Night': float(data.sleep_hours_per_night),
                'Stress_Level': data.stress_level,
                'Grouped_country': grouped_country,
            }])

            # Execute model pipeline prediction
            raw_prediction = model.predict(input_row)

            if len(raw_prediction) == 0:
                raise ValueError("Model returned an empty prediction array.")

            score = float(raw_prediction[0])

            if math.isnan(score) or math.isinf(score):
                raise ValueError("Model produced non-finite prediction score.")

            rounded_score = round(score, 2)
            category = cls._categorize_score(rounded_score)

            logger.info("Successfully predicted score: %.2f (%s)", rounded_score, category.value)

            return PredictionResponse(
                predicted_mental_health_score=rounded_score,
                score_category=category,
                status="success",
            )

        except HTTPException:
            raise
        except Exception as exc:
            logger.error("Prediction inference error: %s", exc, exc_info=True)
            # Do not leak local filepaths or internal python exceptions
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An internal error occurred while calculating the prediction score.",
            )
