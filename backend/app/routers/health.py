from __future__ import annotations

from fastapi import APIRouter

from app import __version__
from app.schemas.api import HealthResponse

router = APIRouter()


@router.get("/api/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    return HealthResponse(status="ok", version=__version__, sim_running=False)
