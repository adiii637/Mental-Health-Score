from fastapi import APIRouter, status
from app.schemas.prediction import StudentDataInput, PredictionResponse
from app.services.prediction_service import PredictionService

router = APIRouter()


@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict Student Mental Health Score",
    description="Accepts lifestyle and demographic inputs, runs the trained scikit-learn ML pipeline, and returns the predicted score.",
)
async def predict_score(data: StudentDataInput) -> PredictionResponse:
    """Validate student habits and predict a mental health score (0–10)."""
    return PredictionService.predict(data)
