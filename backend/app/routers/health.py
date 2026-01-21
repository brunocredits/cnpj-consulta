"""
Endpoint de health check.
"""
from fastapi import APIRouter

from app.domain.models import HealthResponse
from app.services.cache_service import cache_service

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Verifica a saúde da aplicação.
    Retorna status do cache.
    """
    return HealthResponse(
        status="healthy",
        cache_loaded=cache_service.is_loaded,
        cache_size=cache_service.size
    )
