from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.prediction import ScoreCategory, StudentDataInput


class PredictionRecord(BaseModel):
    """A saved prediction document as stored in MongoDB."""
    id: str = Field(..., description="MongoDB ObjectId as string")
    user_id: str = Field(..., description="Owning user's ObjectId string")
    input_features: Dict[str, Any] = Field(..., description="Snapshot of all input fields used for inference")
    predicted_mental_health_score: float = Field(..., description="Predicted score (0–10 scale)")
    score_category: ScoreCategory = Field(..., description="Wellness band: Strained / Balanced / Strong")
    created_at: datetime = Field(..., description="UTC timestamp of prediction")

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "id": "6ae8451213f556310ad1bd56",
                "user_id": "6ae8451213f556310ad1bd00",
                "input_features": {
                    "age": 21, "gender": "Female", "country": "India",
                    "academic_level": "Undergraduate", "most_used_platform": "Instagram",
                    "purpose_of_use": "Education", "avg_daily_usage_hours": 3.5,
                    "daily_unlocks": 45, "study_hours": 6.0, "physical_activity_hours": 1.5,
                    "sleep_hours_per_night": 7.5, "stress_level": "Medium"
                },
                "predicted_mental_health_score": 7.44,
                "score_category": "Strong",
                "created_at": "2026-11-02T08:00:00Z",
            }
        }
    }


class PredictionCreateResponse(BaseModel):
    """Response after creating a new authenticated prediction."""
    id: str = Field(..., description="Saved prediction's MongoDB ObjectId")
    predicted_mental_health_score: float
    score_category: ScoreCategory
    created_at: datetime
    status: str = Field(default="success")


class PredictionHistoryResponse(BaseModel):
    """Paginated list of the current user's predictions."""
    predictions: List[PredictionRecord]
    total: int = Field(..., description="Total number of records for this user")
    limit: int
    offset: int
