"""
Endpoint de consulta de CNPJ.
Protegido por autenticação e rate limit.
"""
import re
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import Annotated

from app.domain.models import ConsultaResponse, ClienteInfo
from app.services.cache_service import cache_service
from app.services.rate_limiter import rate_limiter
from app.services.audit_logger import audit_logger
from app.datasources import ploomes_datasource
from app.routers.dependencies import get_current_user, UserInfo

router = APIRouter(prefix="/api", tags=["Consulta"])


def normalize_cnpj(cnpj: str) -> str:
    """Remove caracteres não numéricos do CNPJ."""
    return re.sub(r'\D', '', cnpj)


def validate_cnpj(cnpj: str) -> bool:
    """
    Valida se o CNPJ tem formato correto.
    Verifica 14 dígitos e dígitos verificadores.
    """
    cnpj_normalized = normalize_cnpj(cnpj)
    
    if len(cnpj_normalized) != 14:
        return False
    
    # Verifica se não são todos dígitos iguais
    if len(set(cnpj_normalized)) == 1:
        return False
    
    # Cálculo do primeiro dígito verificador
    multiplicadores_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = sum(int(cnpj_normalized[i]) * multiplicadores_1[i] for i in range(12))
    resto = soma % 11
    digito_1 = 0 if resto < 2 else 11 - resto
    
    if int(cnpj_normalized[12]) != digito_1:
        return False
    
    # Cálculo do segundo dígito verificador
    multiplicadores_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = sum(int(cnpj_normalized[i]) * multiplicadores_2[i] for i in range(13))
    resto = soma % 11
    digito_2 = 0 if resto < 2 else 11 - resto
    
    if int(cnpj_normalized[13]) != digito_2:
        return False
    
    return True


@router.get("/consulta", response_model=ConsultaResponse)
async def consultar_cnpj(
    request: Request,
    cnpj: Annotated[str, Query(description="CNPJ a ser consultado", min_length=11, max_length=20)],
    user: UserInfo = Depends(get_current_user)
) -> ConsultaResponse:
    """
    Consulta informações de um CNPJ.
    
    - Requer autenticação via token Entra ID
    - Rate limit: 30 requisições por minuto por usuário
    - Retorna apenas: Razão Social, Responsável, Status da Conta
    """
    
    # Verifica rate limit
    if not await rate_limiter.check_rate_limit(user.email):
        raise HTTPException(
            status_code=429,
            detail="Limite de requisições excedido. Tente novamente em alguns segundos."
        )
    
    # Normaliza e valida CNPJ
    cnpj_normalized = normalize_cnpj(cnpj)
    
    if not validate_cnpj(cnpj):
        audit_logger.log_consulta(
            user_email=user.email,
            cnpj=cnpj_normalized,
            encontrado=False,
            ip_address=request.client.host if request.client else None
        )
        return ConsultaResponse(
            encontrado=False,
            mensagem="CNPJ inválido"
        )
    
    # Garante que o cache está carregado
    cache_ok = await ploomes_datasource.ensure_cache_loaded()
    
    if not cache_ok and not cache_service.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="Serviço temporariamente indisponível. Tente novamente em alguns minutos."
        )
    
    # Busca no cache
    record = cache_service.get_by_cnpj(cnpj_normalized)
    
    # Log de auditoria
    audit_logger.log_consulta(
        user_email=user.email,
        cnpj=cnpj_normalized,
        encontrado=record is not None,
        ip_address=request.client.host if request.client else None
    )
    
    if not record:
        return ConsultaResponse(
            encontrado=False,
            mensagem="Cliente não encontrado"
        )
    
    # Retorna apenas os campos necessários
    cliente = ClienteInfo(
        cnpj=cnpj_normalized,
        razao_social=record.get("Nome", ""),
        responsavel=record.get("Responsável", ""),
        status_conta=record.get("Status da Conta", "")
    )
    
    return ConsultaResponse(
        encontrado=True,
        cliente=cliente
    )
