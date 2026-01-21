"""
Dependências compartilhadas entre routers.
"""
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional

from app.services.audit_logger import audit_logger
from app.config.settings import settings

security = HTTPBearer(auto_error=False)


class UserInfo(BaseModel):
    """Informações do usuário autenticado."""
    email: str
    name: Optional[str] = None


def decode_token(token: str) -> dict | None:
    """Decodifica e valida um token JWT."""
    try:
        payload = jwt.decode(
            token, 
            settings.jwt_secret, 
            algorithms=["HS256"]
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserInfo:
    """
    Dependência que valida o token e retorna informações do usuário.
    
    Raises:
        HTTPException: Se o token for inválido ou usuário não autorizado.
    """
    # Modo de desenvolvimento - bypass de autenticação
    if settings.dev_mode:
        return UserInfo(
            email="dev@creditsbrasil.com.br",
            name="Desenvolvedor"
        )
    
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais não fornecidas",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = credentials.credentials
    
    # Valida o token JWT
    payload = decode_token(token)
    
    if not payload:
        audit_logger.log_auth_failure("Token inválido ou expirado")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado. Faça login novamente.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    email = payload.get("email", "")
    
    # Valida o domínio do usuário
    email_domain = email.lower().split("@")[-1]
    if email_domain != settings.allowed_domain.lower():
        audit_logger.log_auth_failure(f"Domínio não autorizado: {email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Acesso negado. Somente usuários @{settings.allowed_domain} podem acessar."
        )
    
    return UserInfo(
        email=email,
        name=email.split("@")[0].replace(".", " ").title()
    )
