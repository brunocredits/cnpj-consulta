"""
Endpoint de autenticação simples por email.
Valida se o email está na lista de emails permitidos.
"""
import jwt
import re
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

from app.config import settings
from app.config.allowed_emails import is_email_allowed

router = APIRouter(prefix="/api/auth", tags=["Autenticação"])

# Chave secreta para JWT (em produção, use uma variável de ambiente)
JWT_SECRET = settings.jwt_secret
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 8


class LoginRequest(BaseModel):
    """Requisição de login."""
    email: EmailStr = Field(..., description="Email do usuário")


class LoginResponse(BaseModel):
    """Resposta do login."""
    success: bool
    token: str | None = None
    email: str | None = None
    message: str


class TokenValidationRequest(BaseModel):
    """Requisição de validação de token."""
    token: str


class TokenValidationResponse(BaseModel):
    """Resposta da validação de token."""
    valid: bool
    email: str | None = None
    message: str


def validate_email_domain(email: str) -> bool:
    """Valida se o email é do domínio permitido."""
    allowed_domain = settings.allowed_domain.lower()
    email_domain = email.lower().split("@")[-1]
    return email_domain == allowed_domain


def create_token(email: str) -> str:
    """Cria um token JWT para o usuário."""
    payload = {
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Decodifica e valida um token JWT."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest) -> LoginResponse:
    """
    Realiza login validando se o email está na lista de permitidos.
    
    - Apenas emails cadastrados são aceitos
    - Retorna um token JWT válido por 8 horas
    """
    email = request.email.lower().strip()
    
    # Primeiro verifica o domínio
    if not validate_email_domain(email):
        raise HTTPException(
            status_code=403,
            detail=f"Acesso negado. Apenas emails @{settings.allowed_domain} são permitidos."
        )
    
    # Depois verifica se o email está na lista de permitidos
    if not is_email_allowed(email):
        raise HTTPException(
            status_code=403,
            detail="Email não cadastrado. Entre em contato com o administrador."
        )
    
    token = create_token(email)
    
    return LoginResponse(
        success=True,
        token=token,
        email=email,
        message="Login realizado com sucesso"
    )


@router.post("/validate", response_model=TokenValidationResponse)
async def validate_token(request: TokenValidationRequest) -> TokenValidationResponse:
    """Valida um token JWT."""
    payload = decode_token(request.token)
    
    if not payload:
        return TokenValidationResponse(
            valid=False,
            message="Token inválido ou expirado"
        )
    
    return TokenValidationResponse(
        valid=True,
        email=payload.get("email"),
        message="Token válido"
    )
