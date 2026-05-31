from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.db.session import engine, Base
from app.api.products import router as products_router
from app.api.customers import router as customers_router
from app.api.orders import router as orders_router
from app.api.dashboard import router as dashboard_router
from app.utils.exceptions import (
    http_exception_handler,
    validation_exception_handler,
    general_exception_handler,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-ready Inventory & Order Management System API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Include routers
app.include_router(products_router, prefix=settings.API_PREFIX)
app.include_router(customers_router, prefix=settings.API_PREFIX)
app.include_router(orders_router, prefix=settings.API_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_PREFIX)


@app.get("/", tags=["Health"])
def health_check():
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "version": settings.VERSION,
            "name": settings.PROJECT_NAME,
        },
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
