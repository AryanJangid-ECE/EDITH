from __future__ import annotations

import logging
from collections.abc import Generator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from starlette.exceptions import HTTPException as StarletteHTTPException

from app import __version__
from app.config import get_settings
from app.core.errors import EdithError
from app.core.request_context import (
    RequestContextMiddleware,
    configure_logging,
    error_headers,
    request_id_from_scope,
    validation_error_details,
)
from app.db import SessionLocal, engine, get_db, init_db
from app.routers.actions import router as actions_router
from app.routers.apps import router as apps_router
from app.routers.assistant import router as assistant_router
from app.routers.auth import router as auth_router
from app.routers.health import router as health_router
from app.routers.settings import router as settings_router
from app.seed import ensure_seed_data

settings = get_settings()
configure_logging(settings.log_level)
logger = logging.getLogger(__name__)


async def handle_edith_error(request: Request, exc: EdithError) -> JSONResponse:
    request_id = request_id_from_scope(request.scope)
    headers = error_headers(request_id)
    headers.update(exc.headers)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}},
        headers=headers,
    )


async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": {"fields": validation_error_details(exc.errors())},
            }
        },
        headers=error_headers(request_id_from_scope(request.scope)),
    )


async def handle_http_error(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    code = "NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR"
    message = "Resource not found" if exc.status_code == 404 else "Request failed"
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": code, "message": message, "details": {}}},
        headers=error_headers(request_id_from_scope(request.scope)),
    )


async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(
        "Unhandled request exception",
        exc_info=(type(exc), exc, exc.__traceback__),
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
                "details": {},
            }
        },
        headers=error_headers(request_id_from_scope(request.scope)),
    )


def create_app(database_engine: Engine = engine) -> FastAPI:
    session_factory = (
        SessionLocal
        if database_engine is engine
        else sessionmaker(autocommit=False, autoflush=False, bind=database_engine, future=True)
    )

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        init_db(database_engine)
        db = session_factory()
        try:
            ensure_seed_data(db)
            db.commit()
        finally:
            db.close()
        yield

    application = FastAPI(
        title="E.D.I.T.H. API",
        version=__version__,
        lifespan=lifespan,
    )

    def get_application_db() -> Generator[Session, None, None]:
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    application.dependency_overrides[get_db] = get_application_db
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.add_middleware(RequestContextMiddleware)
    application.add_exception_handler(EdithError, handle_edith_error)
    application.add_exception_handler(RequestValidationError, handle_validation_error)
    application.add_exception_handler(StarletteHTTPException, handle_http_error)
    application.add_exception_handler(Exception, handle_unexpected_error)

    application.include_router(health_router)
    application.include_router(auth_router)
    application.include_router(apps_router)
    application.include_router(actions_router)
    application.include_router(settings_router)
    application.include_router(assistant_router)
    return application


app = create_app()
