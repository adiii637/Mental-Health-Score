import logging
from pathlib import Path
from typing import Any, Optional
import joblib

logger = logging.getLogger("mentalwell.model_loader")


class ModelManager:
    """Singleton manager for loading and accessing the trained ML model pipeline.
    
    Loads once at application startup to avoid per-request disk I/O overhead.
    """

    _model: Optional[Any] = None
    _is_loaded: bool = False
    _load_error: Optional[str] = None

    @classmethod
    def load_model(cls, model_path: Path | str) -> None:
        """Load the trained scikit-learn pipeline from the specified path."""
        try:
            path = Path(model_path).resolve()
            if not path.is_file():
                error_msg = f"Model file not found at: {path.name}"
                cls._model = None
                cls._is_loaded = False
                cls._load_error = error_msg
                logger.error(error_msg)
                return

            logger.info("Loading ML model pipeline from: %s", path.name)
            cls._model = joblib.load(path)
            cls._is_loaded = True
            cls._load_error = None
            logger.info("ML model pipeline successfully loaded and cached.")
        except Exception as exc:
            cls._model = None
            cls._is_loaded = False
            cls._load_error = str(exc)
            logger.error("Failed to load ML model pipeline: %s", exc, exc_info=True)

    @classmethod
    def get_model(cls) -> Optional[Any]:
        """Return the loaded model pipeline instance or None."""
        return cls._model

    @classmethod
    def is_loaded(cls) -> bool:
        """Check if the model pipeline is loaded and ready for predictions."""
        return cls._is_loaded

    @classmethod
    def get_error(cls) -> Optional[str]:
        """Return any initialization error message."""
        return cls._load_error
