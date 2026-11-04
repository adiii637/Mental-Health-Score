from datetime import datetime, timezone
from enum import Enum
from typing import Literal, Optional, Union, Dict, Any
from pydantic import BaseModel, Field


class ScoreCategory(str, Enum):
    STRAINED = "Strained"
    BALANCED = "Balanced"
    STRONG = "Strong"


class StudentDataInput(BaseModel):
    """Pydantic validation schema for student mental health score prediction input.
    
    Fields strictly match the features expected by the trained ML pipeline:
    - Age (10–100)
    - Gender ('Male', 'Female')
    - Country (String name of country)
    - Academic_Level ('Undergraduate', 'Graduate', 'High School')
    - Most_Used_Platform (12 recognized social media platforms)
    - Purpose_Of_Use ('Networking', 'Education', 'Entertainment', 'News')
    - Avg_Daily_Usage_Hours (0–24)
    - Daily_Unlocks (>= 0)
    - Study_Hours (0–24)
    - Physical_Activity_Hours (0–24)
    - Sleep_Hours_Per_Night (0–24)
    - Stress_Level ('Low', 'Medium', 'High', 'Very High')
    """
    age: int = Field(
        ...,
        ge=10,
        le=100,
        description="Age of student in years (10–100)",
        examples=[21],
    )
    gender: Literal['Male', 'Female'] = Field(
        ...,
        description="Gender identity",
        examples=["Female"],
    )
    country: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Country of residence",
        examples=["India"],
    )
    academic_level: Literal['Undergraduate', 'Graduate', 'High School'] = Field(
        ...,
        description="Current academic level",
        examples=["Undergraduate"],
    )
    most_used_platform: Literal[
        'Facebook',
        'LinkedIn',
        'Instagram',
        'Snapchat',
        'Twitter',
        'YouTube',
        'TikTok',
        'LINE',
        'KakaoTalk',
        'VKontakte',
        'WhatsApp',
        'WeChat',
    ] = Field(
        ...,
        description="Primary social media platform used",
        examples=["Instagram"],
    )
    purpose_of_use: Literal['Networking', 'Education', 'Entertainment', 'News'] = Field(
        ...,
        description="Primary reason for using social media",
        examples=["Education"],
    )
    avg_daily_usage_hours: float = Field(
        ...,
        ge=0.0,
        le=24.0,
        description="Average daily social media usage in hours (0–24)",
        examples=[3.5],
    )
    daily_unlocks: int = Field(
        ...,
        ge=0,
        description="Estimated daily phone unlock count",
        examples=[45],
    )
    study_hours: float = Field(
        ...,
        ge=0.0,
        le=24.0,
        description="Daily dedicated study hours (0–24)",
        examples=[6.0],
    )
    physical_activity_hours: float = Field(
        ...,
        ge=0.0,
        le=24.0,
        description="Daily physical activity in hours (0–24)",
        examples=[1.5],
    )
    sleep_hours_per_night: float = Field(
        ...,
        ge=0.0,
        le=24.0,
        description="Average nightly sleep in hours (0–24)",
        examples=[7.5],
    )
    stress_level: Literal['Low', 'Medium', 'High', 'Very High'] = Field(
        ...,
        description="Self-reported stress level",
        examples=["Medium"],
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "age": 21,
                "gender": "Female",
                "country": "India",
                "academic_level": "Undergraduate",
                "most_used_platform": "Instagram",
                "purpose_of_use": "Education",
                "avg_daily_usage_hours": 3.5,
                "daily_unlocks": 45,
                "study_hours": 6.0,
                "physical_activity_hours": 1.5,
                "sleep_hours_per_night": 7.5,
                "stress_level": "Medium",
            }
        }
    }


class PredictionResponse(BaseModel):
    """Schema for prediction endpoint response."""
    predicted_mental_health_score: float = Field(
        ...,
        description="Continuous predicted mental health score on a 0–10 scale",
        examples=[7.9],
    )
    score_category: ScoreCategory = Field(
        ...,
        description="Qualitative wellness category based on predicted score",
        examples=[ScoreCategory.STRONG],
    )
    status: str = Field(
        default="success",
        description="Status of prediction request",
        examples=["success"],
    )


class PredictionInDB(BaseModel):
    """Prediction document representation stored in MongoDB 'predictions' collection."""
    id: Optional[str] = Field(default=None, alias="_id", description="MongoDB ObjectId as string")
    user_id: Optional[str] = Field(default=None, description="Optional reference to user _id for authenticated predictions")
    input_features: Dict[str, Any] = Field(..., description="Copy of input lifestyle features used for prediction")
    predicted_mental_health_score: float = Field(..., description="Predicted score (0–10 scale)")
    score_category: ScoreCategory = Field(..., description="Score qualitative category")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Prediction timestamp")

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "_id": "6725ea9478f691bdf1088888",
                "user_id": "6725ea9478f691bdf1012345",
                "input_features": {
                    "age": 21,
                    "gender": "Female",
                    "country": "India",
                    "academic_level": "Undergraduate",
                    "most_used_platform": "Instagram",
                    "purpose_of_use": "Education",
                    "avg_daily_usage_hours": 3.5,
                    "daily_unlocks": 45,
                    "study_hours": 6.0,
                    "physical_activity_hours": 1.5,
                    "sleep_hours_per_night": 7.5,
                    "stress_level": "Medium",
                },
                "predicted_mental_health_score": 7.9,
                "score_category": "Strong",
                "created_at": "2026-11-02T12:00:00Z",
            }
        },
    }


class HealthResponse(BaseModel):
    """Schema for backend health check response."""
    status: str = Field(
        ...,
        description="System health status (healthy or degraded)",
        examples=["healthy"],
    )
    model_loaded: bool = Field(
        ...,
        description="Whether the ML pipeline is loaded and ready",
        examples=[True],
    )
    database_connected: bool = Field(
        ...,
        description="Whether the MongoDB connection is verified and active",
        examples=[True],
    )
    version: str = Field(
        ...,
        description="API service version",
        examples=["1.0.0"],
    )
    environment: str = Field(
        ...,
        description="Active runtime environment",
        examples=["development"],
    )
