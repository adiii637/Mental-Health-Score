import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.model_loader import ModelManager
from app.core.database import DatabaseManager
from app.db.indexes import init_db_indexes
from app.routers.health import router as health_router
from app.routers.prediction import router as prediction_router
from app.routers.auth import router as auth_router
from app.routers.predictions import router as predictions_router
from app.routers.journals import router as journals_router
from app.routers.dashboard import router as dashboard_router
from app.routers.chat import router as chat_router
from app.routers.community import router as community_router

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("mentalwell.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI Lifespan: Manage ML model caching and MongoDB connection lifecycle."""
    logger.info("Initializing MentalWell API server...")

    # 1. Load ML model pipeline
    model_path = settings.resolved_model_path
    logger.info("Configured model path: %s", model_path)
    ModelManager.load_model(model_path)

    if ModelManager.is_loaded():
        logger.info("✓ Model pipeline ready for inference.")
    else:
        logger.warning("⚠ Model pipeline failed to load: %s", ModelManager.get_error())

    # 2. Connect to MongoDB via PyMongo AsyncMongoClient
    await DatabaseManager.connect()

    if DatabaseManager.is_connected():
        try:
            db = DatabaseManager.get_database()
            if db is not None:
                await init_db_indexes(db)
        except Exception as exc:
            logger.warning("⚠ Index creation encountered an issue: %s", exc)
    else:
        logger.info("ℹ Server starting with database in disconnected/standalone mode.")

    yield

    # 3. Clean shutdown of database connection
    logger.info("Shutting down MentalWell API server...")
    await DatabaseManager.disconnect()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for MentalWell — Student Mental Health Score Prediction & Wellness Assistant.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration allowing React frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 Routers
app.include_router(health_router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(prediction_router, prefix=settings.API_V1_STR, tags=["Prediction"])  # backward-compat /predict
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(predictions_router, prefix=settings.API_V1_STR)  # authenticated /predictions
app.include_router(journals_router, prefix=settings.API_V1_STR)      # authenticated /journals
app.include_router(dashboard_router, prefix=settings.API_V1_STR)     # authenticated /dashboard
app.include_router(chat_router, prefix=settings.API_V1_STR)          # authenticated /chat
app.include_router(community_router, prefix=settings.API_V1_STR)     # authenticated /community


@app.get("/", tags=["Root"])
def root():
    """Root info endpoint."""
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "predict": f"{settings.API_V1_STR}/predict",
        "auth": {
            "register": f"{settings.API_V1_STR}/auth/register",
            "login": f"{settings.API_V1_STR}/auth/login",
            "me": f"{settings.API_V1_STR}/auth/me",
        },
        "predictions": f"{settings.API_V1_STR}/predictions",
        "journals": f"{settings.API_V1_STR}/journals",
        "dashboard": f"{settings.API_V1_STR}/dashboard/summary",
        "chat": f"{settings.API_V1_STR}/chat/message",
        "community": f"{settings.API_V1_STR}/community/posts",
    }
