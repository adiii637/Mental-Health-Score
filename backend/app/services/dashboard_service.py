import logging
from typing import Any, Dict, List, Optional
from pymongo.asynchronous.database import AsyncDatabase
from fastapi import HTTPException, status

from app.schemas.prediction import ScoreCategory
from app.schemas.prediction_record import PredictionRecord
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    TrendPoint,
    WellnessInsight,
)
from app.services.user_prediction_service import UserPredictionService

logger = logging.getLogger("mentalwell.dashboard_service")


class DashboardService:
    """
    Computes real, authenticated dashboard metrics and trends.
    Strictly user-isolated; never returns unauthenticated or mock data.
    """

    @staticmethod
    def _generate_insights(features: Optional[Dict[str, Any]]) -> List[WellnessInsight]:
        """
        Generate non-diagnostic lifestyle observations based strictly on
        recorded student features.
        Never implies medical diagnosis or causation.
        """
        if not features:
            return []

        insights: List[WellnessInsight] = []

        # 1. Sleep Observation
        sleep = features.get("sleep_hours_per_night")
        if sleep is not None:
            try:
                sleep_val = float(sleep)
                if sleep_val < 6.5:
                    insights.append(
                        WellnessInsight(
                            category="sleep",
                            title="Rest & Sleep Target",
                            description=(
                                f"Your recorded sleep duration is {sleep_val:.1f} hrs/night. "
                                "General student wellness guidance recommends 7–9 hours for cognitive recovery. "
                                "(Lifestyle observation, not medical advice.)"
                            ),
                            tag="Lifestyle Observation",
                        )
                    )
                else:
                    insights.append(
                        WellnessInsight(
                            category="sleep",
                            title="Healthy Rest Pattern",
                            description=(
                                f"You reported getting {sleep_val:.1f} hrs of sleep per night, "
                                "which aligns well with recommended rest targets for university students."
                            ),
                            tag="Lifestyle Observation",
                        )
                    )
            except (ValueError, TypeError):
                pass

        # 2. Digital Screen & Social Media
        usage = features.get("avg_daily_usage_hours")
        platform = features.get("most_used_platform", "social media")
        if usage is not None:
            try:
                usage_val = float(usage)
                if usage_val >= 4.5:
                    insights.append(
                        WellnessInsight(
                            category="screen_time",
                            title="Digital Boundaries",
                            description=(
                                f"Daily {platform} usage was reported at {usage_val:.1f} hrs. "
                                "Taking short screen-free breaks during the evening can help reduce digital fatigue."
                            ),
                            tag="Lifestyle Observation",
                        )
                    )
                else:
                    insights.append(
                        WellnessInsight(
                            category="screen_time",
                            title="Mindful Screen Time",
                            description=(
                                f"Daily usage of {usage_val:.1f} hrs on {platform} indicates a balanced screen time routine."
                            ),
                            tag="Lifestyle Observation",
                        )
                    )
            except (ValueError, TypeError):
                pass

        # 3. Physical Activity
        activity = features.get("physical_activity_hours")
        if activity is not None:
            try:
                act_val = float(activity)
                if act_val < 0.75:
                    insights.append(
                        WellnessInsight(
                            category="physical_activity",
                            title="Daily Movement",
                            description=(
                                f"Daily physical activity is currently recorded at {act_val:.1f} hrs. "
                                "A gentle 15–20 minute walk between study blocks can support sustained alertness and calm."
                            ),
                            tag="Lifestyle Observation",
                        )
                    )
                else:
                    insights.append(
                        WellnessInsight(
                            category="physical_activity",
                            title="Active Lifestyle Habit",
                            description=(
                                f"You reported {act_val:.1f} hrs of daily physical activity, "
                                "an active routine that supports overall student wellbeing."
                            ),
                            tag="Lifestyle Observation",
                        )
                    )
            except (ValueError, TypeError):
                pass

        # 4. Study & Focus Balance
        study = features.get("study_hours")
        unlocks = features.get("daily_unlocks")
        if study is not None and unlocks is not None:
            try:
                study_val = float(study)
                unlock_val = int(unlocks)
                if unlock_val > 50 and study_val >= 5.0:
                    insights.append(
                        WellnessInsight(
                            category="study",
                            title="Study Focus & Notifications",
                            description=(
                                f"With {study_val:.1f} study hrs and {unlock_val} daily phone unlocks, "
                                "scheduling notification-free intervals (like 25-minute Pomodoro sessions) may reduce study interruptions."
                            ),
                            tag="Lifestyle Observation",
                        )
                    )
            except (ValueError, TypeError):
                pass

        # 5. Stress Level Observation
        stress = features.get("stress_level")
        if stress in ["High", "Very High"]:
            insights.append(
                WellnessInsight(
                    category="stress",
                    title="Stress Regulation",
                    description=(
                        f"Current self-reported stress is '{stress}'. "
                        "Practical grounding techniques like 4-7-8 breathing in the Resources tab can help lower acute tension."
                    ),
                    tag="Lifestyle Observation",
                )
            )

        return insights

    @classmethod
    async def get_summary(
        cls,
        db: AsyncDatabase,
        current_user: Dict[str, Any],
    ) -> DashboardSummaryResponse:
        """
        Produce a consolidated dashboard overview for the authenticated user.
        """
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable.",
            )

        user_oid = current_user["_id"]
        user_name = current_user.get("name", "Student")
        user_email = current_user.get("email", "")

        try:
            # 1. Total counts
            total_assessments = await db.predictions.count_documents({"user_id": user_oid})
            total_journals = await db.journals.count_documents({"user_id": user_oid})

            # 2. Fetch last 10 predictions for trends and recent history
            cursor = (
                db.predictions.find({"user_id": user_oid})
                .sort("created_at", -1)
                .limit(10)
            )
            raw_docs = await cursor.to_list(length=10)

            # Convert to PredictionRecord objects
            records: List[PredictionRecord] = [
                UserPredictionService._doc_to_record(d) for d in raw_docs
            ]

            latest_record: Optional[PredictionRecord] = records[0] if records else None
            previous_record: Optional[PredictionRecord] = records[1] if len(records) > 1 else None

            latest_score = latest_record.predicted_mental_health_score if latest_record else None
            latest_category = latest_record.score_category if latest_record else None
            previous_score = previous_record.predicted_mental_health_score if previous_record else None

            score_diff: Optional[float] = None
            if latest_score is not None and previous_score is not None:
                score_diff = round(latest_score - previous_score, 2)

            # Build trend chronologically (oldest to newest for Recharts)
            chronological = list(reversed(records))
            trend_points: List[TrendPoint] = [
                TrendPoint(
                    date=r.created_at.strftime("%b %d"),
                    full_date=r.created_at.strftime("%b %d, %Y %H:%M"),
                    score=r.predicted_mental_health_score,
                    category=r.score_category,
                    timestamp=r.created_at,
                )
                for r in chronological
            ]

            # Generate wellness observations based on latest features
            insights: List[WellnessInsight] = []
            if latest_record and latest_record.input_features:
                insights = cls._generate_insights(latest_record.input_features)

            # Recent assessments (up to 5)
            recent_assessments = records[:5]

            return DashboardSummaryResponse(
                user_name=user_name,
                user_email=user_email,
                latest_score=latest_score,
                latest_category=latest_category,
                latest_record=latest_record,
                previous_score=previous_score,
                score_difference=score_diff,
                total_assessments=total_assessments,
                total_journals=total_journals,
                trend=trend_points,
                insights=insights,
                recent_assessments=recent_assessments,
            )

        except Exception as exc:
            logger.error("Failed to compile dashboard summary: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not generate dashboard summary.",
            )
