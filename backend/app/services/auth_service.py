"""
Serviço de autenticação com Microsoft Entra ID.
Valida tokens JWT usando JWKS do Azure AD.
"""
import httpx
from jose import jwt, JWTError, jwk
from jose.utils import base64url_decode
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class AuthService:
    """Serviço para validação de tokens JWT do Entra ID."""
    
    def __init__(self):
        self._jwks_cache: Optional[Dict[str, Any]] = None
        self._jwks_cache_time: Optional[datetime] = None
        self._jwks_cache_ttl = timedelta(hours=24)
    
    async def get_jwks(self) -> Dict[str, Any]:
        """Obtém as chaves JWKS do Azure AD com cache."""
        now = datetime.utcnow()
        
        if (
            self._jwks_cache is not None 
            and self._jwks_cache_time is not None
            and now - self._jwks_cache_time < self._jwks_cache_ttl
        ):
            return self._jwks_cache
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                settings.azure_jwks_url,
                timeout=10.0
            )
            response.raise_for_status()
            self._jwks_cache = response.json()
            self._jwks_cache_time = now
            logger.info("JWKS cache atualizado")
            return self._jwks_cache
    
    def _get_signing_key(self, token: str, jwks: Dict[str, Any]) -> Optional[str]:
        """Encontra a chave de assinatura correta baseada no kid do token."""
        try:
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            
            for key in jwks.get("keys", []):
                if key.get("kid") == kid:
                    return key
            
            return None
        except JWTError:
            return None
    
    async def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Valida um token JWT do Entra ID.
        
        Returns:
            Claims do token se válido, None caso contrário.
        """
        try:
            jwks = await self.get_jwks()
            signing_key = self._get_signing_key(token, jwks)
            
            if not signing_key:
                logger.warning("Chave de assinatura não encontrada no JWKS")
                return None
            
            claims = jwt.decode(
                token,
                signing_key,
                algorithms=["RS256"],
                audience=settings.client_id,
                issuer=settings.azure_issuer,
                options={
                    "verify_exp": True,
                    "verify_iat": True,
                    "verify_nbf": True,
                }
            )
            
            return claims
            
        except JWTError as e:
            logger.warning(f"Erro na validação do token: {e}")
            return None
        except Exception as e:
            logger.error(f"Erro inesperado na validação: {e}")
            return None
    
    def validate_domain(self, claims: Dict[str, Any]) -> bool:
        """
        Valida se o usuário pertence ao domínio permitido.
        
        Args:
            claims: Claims do token JWT.
            
        Returns:
            True se o domínio é válido.
        """
        email = claims.get("preferred_username") or claims.get("email") or claims.get("upn")
        
        if not email:
            logger.warning("Email não encontrado nos claims do token")
            return False
        
        if not email.lower().endswith(f"@{settings.allowed_domain.lower()}"):
            logger.warning(f"Domínio não autorizado: {email}")
            return False
        
        return True
    
    def get_user_email(self, claims: Dict[str, Any]) -> Optional[str]:
        """Extrai o email do usuário dos claims."""
        return claims.get("preferred_username") or claims.get("email") or claims.get("upn")


auth_service = AuthService()
