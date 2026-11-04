"""API route controllers."""
from .health import router as health_router
from .prediction import router as prediction_router
from .auth import router as auth_router
from .chat import router as chat_router

__all__ = ["health_router", "prediction_router", "auth_router", "chat_router"]
