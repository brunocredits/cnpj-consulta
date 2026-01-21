"""
Datasource para os callbacks do Ploomes.
Faz fetch dos dados, normaliza e mescla com prioridade.
"""
import asyncio
import httpx
from typing import Dict, List, Any, Optional
import logging
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)

from app.config import settings
from app.services.cache_service import cache_service

logger = logging.getLogger(__name__)


class PloomesDataSource:
    """Datasource para buscar dados dos callbacks Ploomes."""
    
    def __init__(self):
        self._http_client: Optional[httpx.AsyncClient] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Retorna ou cria um cliente HTTP."""
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(
                timeout=httpx.Timeout(settings.http_timeout_seconds),
                follow_redirects=True,
                headers={
                    "Accept": "application/json",
                    "User-Agent": "Credits-CNPJ-Consulta/1.0"
                }
            )
        return self._http_client
    
    async def close(self) -> None:
        """Fecha o cliente HTTP."""
        if self._http_client and not self._http_client.is_closed:
            await self._http_client.aclose()
    
    def _extract_records(self, data: Any) -> List[Dict[str, Any]]:
        """
        Extrai registros do JSON retornado.
        Suporta array direto [...] ou objeto com chave value: [...].
        """
        if isinstance(data, list):
            return data
        elif isinstance(data, dict):
            if "value" in data and isinstance(data["value"], list):
                return data["value"]
            return [data]
        return []
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.HTTPStatusError))
    )
    async def _fetch_callback(self, url: str) -> List[Dict[str, Any]]:
        """Busca dados de um callback com retry."""
        client = await self._get_client()
        
        try:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            records = self._extract_records(data)
            logger.info(f"Callback retornou {len(records)} registros")
            return records
        except httpx.TimeoutException:
            logger.error("Timeout ao buscar callback")
            raise
        except httpx.HTTPStatusError as e:
            logger.error(f"Erro HTTP {e.response.status_code} ao buscar callback")
            raise
        except Exception as e:
            logger.error(f"Erro ao processar callback: {e}")
            raise
    
    def _normalize_cnpj(self, cnpj: Any) -> str:
        """Remove caracteres não numéricos do CNPJ."""
        if cnpj is None:
            return ""
        return "".join(filter(str.isdigit, str(cnpj)))
    
    def _merge_records(
        self,
        callback1_records: List[Dict[str, Any]],
        callback2_records: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Mescla registros dos dois callbacks.
        CALLBACK_2 tem prioridade sobre CALLBACK_1.
        """
        merged: Dict[str, Dict[str, Any]] = {}
        
        # Primeiro adiciona do callback 1
        for record in callback1_records:
            cnpj = record.get("CNPJ", "")
            cnpj_normalized = self._normalize_cnpj(cnpj)
            if cnpj_normalized:
                merged[cnpj_normalized] = record
        
        # Depois sobrescreve com callback 2 (prioridade)
        for record in callback2_records:
            cnpj = record.get("CNPJ", "")
            cnpj_normalized = self._normalize_cnpj(cnpj)
            if cnpj_normalized:
                merged[cnpj_normalized] = record
        
        logger.info(
            f"Merge: {len(callback1_records)} + {len(callback2_records)} = {len(merged)} únicos"
        )
        
        return list(merged.values())
    
    async def refresh_cache(self) -> bool:
        """
        Atualiza o cache com dados dos callbacks.
        
        Returns:
            True se sucesso, False se falhou.
        """
        try:
            logger.info("Iniciando refresh do cache...")
            
            # Busca ambos callbacks em paralelo
            results = await asyncio.gather(
                self._fetch_callback(settings.ploomes_callback_1),
                self._fetch_callback(settings.ploomes_callback_2),
                return_exceptions=True
            )
            
            callback1_records = results[0] if not isinstance(results[0], Exception) else []
            callback2_records = results[1] if not isinstance(results[1], Exception) else []
            
            if isinstance(results[0], Exception):
                logger.warning(f"Falha no callback 1: {results[0]}")
            if isinstance(results[1], Exception):
                logger.warning(f"Falha no callback 2: {results[1]}")
            
            if not callback1_records and not callback2_records:
                logger.error("Ambos callbacks falharam")
                return False
            
            merged_records = self._merge_records(callback1_records, callback2_records)
            await cache_service.set_data(merged_records)
            
            logger.info("Cache atualizado com sucesso")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao atualizar cache: {e}")
            return False
    
    async def ensure_cache_loaded(self) -> bool:
        """
        Garante que o cache está carregado e não expirado.
        
        Returns:
            True se cache disponível, False caso contrário.
        """
        if not cache_service.is_loaded or cache_service.is_expired:
            return await self.refresh_cache()
        return True


ploomes_datasource = PloomesDataSource()
