import hashlib
import json
import logging
from typing import Any

import redis.asyncio as aioredis

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None
CACHE_TTL = 3600  # 1 hour


async def get_redis() -> aioredis.Redis | None:
    global _redis
    if _redis is None:
        try:
            settings = get_settings()
            _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
            await _redis.ping()
        except Exception as e:
            logger.warning(f"Redis unavailable, caching disabled: {e}")
            _redis = None
    return _redis


def _make_cache_key(fields: dict[str, Any]) -> str:
    canonical = json.dumps(fields, sort_keys=True, ensure_ascii=False)
    return "alharis:validation:" + hashlib.sha256(canonical.encode()).hexdigest()


async def get_cached(fields: dict[str, Any]) -> dict | None:
    r = await get_redis()
    if r is None:
        return None
    try:
        key = _make_cache_key(fields)
        value = await r.get(key)
        if value:
            return json.loads(value)
    except Exception as e:
        logger.warning(f"Cache get error: {e}")
    return None


async def set_cached(fields: dict[str, Any], result: dict) -> None:
    r = await get_redis()
    if r is None:
        return
    try:
        key = _make_cache_key(fields)
        await r.setex(key, CACHE_TTL, json.dumps(result, ensure_ascii=False))
    except Exception as e:
        logger.warning(f"Cache set error: {e}")
