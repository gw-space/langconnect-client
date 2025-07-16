import logging
import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from langconnect.api import auth_router, collections_router, documents_router
from langconnect.config import ALLOWED_ORIGINS
from langconnect.database.collections import CollectionsManager

# Configure NLTK data path
try:
    import nltk
    nltk_data_path = "/home/langconnect/nltk_data"
    if os.path.exists(nltk_data_path):
        nltk.data.path.append(nltk_data_path)
        logging.info(f"NLTK data path configured: {nltk_data_path}")
    else:
        logging.warning(f"NLTK data path does not exist: {nltk_data_path}")
except ImportError:
    logging.info("NLTK not available")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


# Initialize FastAPI app


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for FastAPI application."""
    logger.info("App is starting up. Creating background worker...")
    await CollectionsManager.setup()
    yield
    logger.info("App is shutting down. Stopping background worker...")


APP = FastAPI(
    title="LangConnect API",
    description="A REST API for a RAG system using FastAPI and LangChain",
    version="0.1.0",
    lifespan=lifespan,
)

# Add CORS middleware
APP.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
APP.include_router(auth_router)
APP.include_router(collections_router)
APP.include_router(documents_router)


@APP.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("langconnect.server:APP", host="0.0.0.0", port=8080)
