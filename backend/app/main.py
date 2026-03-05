import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.api.routes import health, validate, websocket, dashboard

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Al-Haris API starting up...")
    yield
    logger.info("Al-Haris API shutting down...")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Al-Haris — Semantic Guardian API",
        description="AI-powered real-time survey validation for GASTAT",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, tags=["Health"])
    app.include_router(validate.router, prefix="/api/v1", tags=["Validation"])
    app.include_router(dashboard.router, prefix="/api/v1", tags=["Dashboard"])
    app.include_router(websocket.router, tags=["WebSocket"])

    # Serve built React frontend (production only — static/ dir exists in Docker image)
    if os.path.exists("static/assets"):
        app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

    if os.path.exists("static/index.html"):
        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_spa(full_path: str):
            file_path = f"static/{full_path}"
            if os.path.isfile(file_path):
                return FileResponse(file_path)
            return FileResponse("static/index.html")

    return app


app = create_app()
