from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "MentalWell Backend API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Default to root directory Mental_Health_Model.pkl
    # config.py -> core -> app -> backend -> root
    MODEL_PATH: str = str(
        Path(__file__).resolve().parent.parent.parent.parent / "Mental_Health_Model.pkl"
    )

    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # MongoDB Configuration (PyMongo Async API)
    MONGODB_URI: str = ""
    MONGODB_DATABASE: str = "mentalwell"
    MONGODB_TIMEOUT_MS: int = 3000

    # JWT Authentication Settings
    JWT_SECRET_KEY: str = "mentalwell_super_secret_jwt_key_at_least_32_bytes_long_for_security_compliance"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Google Gemini AI Chat Settings
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_TIMEOUT_SECONDS: int = 30

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        return self.CORS_ORIGINS

    @property
    def resolved_model_path(self) -> Path:
        raw_path = Path(self.MODEL_PATH)
        if raw_path.is_absolute():
            return raw_path
        # If relative, resolve relative to project root
        return (Path(__file__).resolve().parent.parent.parent.parent / raw_path).resolve()

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
