import logging
from pymongo import ASCENDING, DESCENDING
from pymongo.asynchronous.database import AsyncDatabase

logger = logging.getLogger("mentalwell.indexes")


async def init_db_indexes(db: AsyncDatabase) -> None:
    """Create essential indexes across all MentalWell collections.
    
    Safe to execute repeatedly (idempotent in MongoDB).
    
    Indexes created:
    - users: unique index on 'email'
    - predictions: compound index on ('user_id', 'created_at')
    - journals: compound index on ('user_id', 'created_at')
    - chat_sessions: compound index on ('user_id', 'updated_at')
    - community_posts: index on ('created_at',) descending
    - community_comments: index on ('post_id', 'created_at')
    - community_reactions: unique compound index on ('post_id', 'user_id')
    """
    if db is None:
        logger.warning("Database instance is None; skipping index initialization.")
        return

    try:
        logger.info("Initializing MongoDB indexes...")

        # 1. users: unique index on lowercase email
        await db.users.create_index(
            [("email", ASCENDING)],
            unique=True,
            name="uniq_users_email",
        )
        logger.info("✓ Index verified: users.email (unique)")

        # 2. predictions: compound index on user_id and creation time
        await db.predictions.create_index(
            [("user_id", ASCENDING), ("created_at", DESCENDING)],
            name="idx_predictions_user_created",
        )
        logger.info("✓ Index verified: predictions (user_id ASC, created_at DESC)")

        # 3. journals: compound index on user_id and creation time
        await db.journals.create_index(
            [("user_id", ASCENDING), ("created_at", DESCENDING)],
            name="idx_journals_user_created",
        )
        logger.info("✓ Index verified: journals (user_id ASC, created_at DESC)")

        # 4. chat_sessions: compound index on user_id and last update time
        await db.chat_sessions.create_index(
            [("user_id", ASCENDING), ("updated_at", DESCENDING)],
            name="idx_chat_sessions_user_updated",
        )
        logger.info("✓ Index verified: chat_sessions (user_id ASC, updated_at DESC)")

        # 5. community_posts: sort by newest first
        await db.community_posts.create_index(
            [("created_at", DESCENDING)],
            name="idx_community_posts_created",
        )
        logger.info("✓ Index verified: community_posts (created_at DESC)")

        # 6. community_posts: category filter index
        await db.community_posts.create_index(
            [("category", ASCENDING), ("created_at", DESCENDING)],
            name="idx_community_posts_category_created",
        )
        logger.info("✓ Index verified: community_posts (category ASC, created_at DESC)")

        # 7. community_comments: fetch by post
        await db.community_comments.create_index(
            [("post_id", ASCENDING), ("created_at", ASCENDING)],
            name="idx_community_comments_post_created",
        )
        logger.info("✓ Index verified: community_comments (post_id ASC, created_at ASC)")

        # 8. community_reactions: unique compound index prevents duplicate reactions
        await db.community_reactions.create_index(
            [("post_id", ASCENDING), ("user_id", ASCENDING)],
            unique=True,
            name="uniq_community_reactions_post_user",
        )
        logger.info("✓ Index verified: community_reactions (post_id, user_id) UNIQUE")

    except Exception as exc:
        logger.error("Failed to initialize database indexes: %s", exc, exc_info=True)
        raise
