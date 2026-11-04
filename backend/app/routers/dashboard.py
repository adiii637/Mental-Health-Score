import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends
from pymongo.asynchronous.database import AsyncDatabase

from app.core.dependencies import get_current_user
from app.core.database import get_db
from app.schemas.dashboard import DashboardSummaryResponse
from app.services.dashboard_service import DashboardService

logger = logging.getLogger("mentalwell.routers.dashboard")

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    summary="Get authenticated user's dashboard summary",
    description=(
        "Retrieves the latest score, score category, total assessments, "
        "previous score, delta, historical trend points for Recharts, "
        "lifestyle observations, and recent records."
    ),
)
async def get_dashboard_summary(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncDatabase = Depends(get_db),
):
    return await DashboardService.get_summary(db, current_user)
