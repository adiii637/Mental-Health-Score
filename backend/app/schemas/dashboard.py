from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.prediction import ScoreCategory
from app.schemas.prediction_record import PredictionRecord


class TrendPoint(BaseModel):
    """A data point representing historical score progression for Recharts."""
    date: str = Field(..., description="Short date label for chart X-axis")
    full_date: str = Field(..., description="Detailed date string for tooltip")
    score: float = Field(..., description="Score 0–10")
    category: ScoreCategory = Field(..., description="Score category: Strained, Balanced, or Strong")
    timestamp: datetime = Field(..., description="UTC timestamp")


class WellnessInsight(BaseModel):
    """Non-diagnostic wellness observation derived from authenticated user's recorded features."""
    category: str = Field(..., description="Category tag: sleep, screen_time, physical_activity, study, stress")
    title: str = Field(..., description="Short headline for the insight card")
    description: str = Field(..., description="Observation text emphasizing lifestyle habits without medical claim")
    tag: str = Field(default="Lifestyle Observation", description="Indicator clarifying non-medical nature")


class DashboardSummaryResponse(BaseModel):
    """Consolidated dashboard overview for authenticated user."""
    user_name: str
    user_email: str
    latest_score: Optional[float] = None
    latest_category: Optional[ScoreCategory] = None
    latest_record: Optional[PredictionRecord] = None
    previous_score: Optional[float] = None
    score_difference: Optional[float] = None
    total_assessments: int = 0
    total_journals: int = 0
    trend: List[TrendPoint] = []
    insights: List[WellnessInsight] = []
    recent_assessments: List[PredictionRecord] = []
