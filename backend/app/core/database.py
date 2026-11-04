import logging
from typing import Optional
from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase
from app.core.config import settings

logger = logging.getLogger("mentalwell.database")


class DatabaseManager:
    """Manages the official PyMongo asynchronous database connection lifecycle."""

    _client: Optional[AsyncMongoClient] = None
    _db: Optional[AsyncDatabase] = None
    _is_connected: bool = False
    _connection_error: Optional[str] = None

    @classmethod
    async def connect(cls) -> None:
        """Initialize the AsyncMongoClient and verify connectivity with a ping."""
        uri = settings.MONGODB_URI.strip() if settings.MONGODB_URI else ""

        if not uri:
            logger.info("MONGODB_URI is not configured; database operations will be disabled.")
            cls._client = None
            cls._db = None
            cls._is_connected = False
            cls._connection_error = "MONGODB_URI not configured"
            return

        try:
            logger.info("Connecting to MongoDB via PyMongo AsyncMongoClient...")
            cls._client = AsyncMongoClient(
                uri,
                serverSelectionTimeoutMS=settings.MONGODB_TIMEOUT_MS,
            )
            # Verify connectivity via ping command
            await cls._client.admin.command("ping")
            cls._db = cls._client[settings.MONGODB_DATABASE]
            cls._is_connected = True
            cls._connection_error = None
            logger.info("✓ Connected to MongoDB database '%s' successfully.", settings.MONGODB_DATABASE)
        except Exception as exc:
            cls._is_connected = False
            cls._db = None
            cls._connection_error = str(exc)
            logger.warning("⚠ MongoDB connection failed: %s. Continuing with ML functionality enabled.", exc)
            if cls._client:
                try:
                    await cls._client.close()
                except Exception:
                    pass
                cls._client = None

    @classmethod
    async def disconnect(cls) -> None:
        """Close AsyncMongoClient connection during application shutdown."""
        if cls._client is not None:
            logger.info("Closing MongoDB connection...")
            try:
                await cls._client.close()
            except Exception as exc:
                logger.warning("Error closing MongoDB connection: %s", exc)
            finally:
                cls._client = None
                cls._db = None
                cls._is_connected = False
                logger.info("MongoDB client disconnected cleanly.")

    @classmethod
    def get_database(cls) -> Optional[AsyncDatabase]:
        """Return the active AsyncDatabase instance or None."""
        return cls._db

    @classmethod
    def is_connected(cls) -> bool:
        """Check if database connection is verified and active."""
        return cls._is_connected

    @classmethod
    def get_error(cls) -> Optional[str]:
        """Return connection error description if any."""
        return cls._connection_error


async def get_db() -> Optional[AsyncDatabase]:
    """FastAPI dependency for accessing the current MongoDB database instance."""
    return DatabaseManager.get_database()
