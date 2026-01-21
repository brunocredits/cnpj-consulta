"""
Serviço de cache em memória com TTL.
Armazena índice de CNPJs para consulta rápida.
"""
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    """Cache em memória com TTL para dados dos callbacks."""
    
    def __init__(self):
        self._data: Dict[str, Dict[str, Any]] = {}  # Índice por CNPJ normalizado
        self._last_update: Optional[datetime] = None
        self._lock = asyncio.Lock()
        self._loading = False
    
    @property
    def is_loaded(self) -> bool:
        """Verifica se o cache foi carregado."""
        return self._last_update is not None
    
    @property
    def is_expired(self) -> bool:
        """Verifica se o cache expirou."""
        if self._last_update is None:
            return True
        
        ttl = timedelta(seconds=settings.cache_ttl_seconds)
        return datetime.utcnow() - self._last_update > ttl
    
    @property
    def size(self) -> int:
        """Retorna a quantidade de registros no cache."""
        return len(self._data)
    
    def _normalize_cnpj(self, cnpj: str) -> str:
        """Remove caracteres não numéricos do CNPJ."""
        return "".join(filter(str.isdigit, cnpj))
    
    async def set_data(self, records: list[Dict[str, Any]]) -> None:
        """
        Atualiza o cache com novos registros.
        
        Args:
            records: Lista de registros (já mesclados com prioridade).
        """
        async with self._lock:
            self._data.clear()
            
            for record in records:
                cnpj_raw = record.get("CNPJ", "")
                cnpj_normalized = self._normalize_cnpj(cnpj_raw)
                
                if cnpj_normalized and len(cnpj_normalized) == 14:
                    self._data[cnpj_normalized] = record
            
            self._last_update = datetime.utcnow()
            logger.info(f"Cache atualizado com {len(self._data)} registros")
    
    def get_by_cnpj(self, cnpj: str) -> Optional[Dict[str, Any]]:
        """
        Busca um registro pelo CNPJ.
        
        Args:
            cnpj: CNPJ a ser consultado (com ou sem formatação).
            
        Returns:
            Registro encontrado ou None.
        """
        cnpj_normalized = self._normalize_cnpj(cnpj)
        return self._data.get(cnpj_normalized)
    
    def clear(self) -> None:
        """Limpa o cache."""
        self._data.clear()
        self._last_update = None
        logger.info("Cache limpo")


cache_service = CacheService()
