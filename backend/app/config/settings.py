"""
Configurações da aplicação carregadas de variáveis de ambiente.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configurações da aplicação."""
    
    # Modo de desenvolvimento (bypass de autenticação)
    dev_mode: bool = False
    
    # JWT Secret para autenticação
    jwt_secret: str = "credits-brasil-secret-key-change-in-production"
    
    # Domínio permitido para login
    allowed_domain: str = "creditsbrasil.com.br"
    
    # Callbacks Ploomes (NUNCA expor ao frontend)
    ploomes_callback_1: str
    ploomes_callback_2: str
    
    # Cache
    cache_ttl_seconds: int = 600  # 10 minutos
    
    # Rate Limiting
    rate_limit_per_minute: int = 30
    
    # HTTP Client
    http_timeout_seconds: int = 30
    http_max_retries: int = 3
    
    # CORS
    frontend_url: str = "http://localhost:5173"
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Retorna instância cacheada das configurações."""
    return Settings()


settings = get_settings()
