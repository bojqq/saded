from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import get_settings

settings = get_settings()

# Use asyncpg driver for async support
_async_url = settings.database_url.replace(
    "postgresql://", "postgresql+asyncpg://"
).replace("?sslmode=require", "")

engine = create_async_engine(
    _async_url,
    connect_args={"ssl": "require"} if "supabase" in settings.database_url else {},
    echo=settings.environment == "development",
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
