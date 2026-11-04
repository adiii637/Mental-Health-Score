from fastapi import APIRouter
from app.core.config import settings
from app.core.model_loader import ModelManager
from app.core.database import DatabaseManager
from app.schemas.prediction import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Check API, Model, and Database Health",
    description="Returns backend server health status, model availability, and MongoDB connectivity.",
)
async def health_check() -> HealthResponse:
    """Return backend status, ML model load state, and MongoDB connection state."""
    model_ok = ModelManager.is_loaded()
    db_ok = DatabaseManager.is_connected()

    # Overall system health:
    # "healthy" if both ML model and MongoDB connection are active.
    # "degraded" if either component is unavailable.
    status = "healthy" if (model_ok and db_ok) else "degraded"

    return HealthResponse(
        status=status,
        model_loaded=model_ok,
        database_connected=db_ok,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
    )
