"""
Rate Limiter por usuário usando sliding window.
"""
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class RateLimiter:
    """Rate limiter com sliding window por usuário."""
    
    def __init__(self):
        self._requests: Dict[str, List[datetime]] = {}
        self._lock = asyncio.Lock()
        self._window = timedelta(minutes=1)
        self._limit = settings.rate_limit_per_minute
    
    async def check_rate_limit(self, user_id: str) -> bool:
        """
        Verifica se o usuário pode fazer uma requisição.
        
        Args:
            user_id: Identificador do usuário (email).
            
        Returns:
            True se permitido, False se limite excedido.
        """
        async with self._lock:
            now = datetime.utcnow()
            cutoff = now - self._window
            
            if user_id not in self._requests:
                self._requests[user_id] = []
            
            # Remove requisições antigas
            self._requests[user_id] = [
                ts for ts in self._requests[user_id] if ts > cutoff
            ]
            
            if len(self._requests[user_id]) >= self._limit:
                logger.warning(f"Rate limit excedido para {user_id}")
                return False
            
            self._requests[user_id].append(now)
            return True
    
    def get_remaining(self, user_id: str) -> int:
        """Retorna quantas requisições restam para o usuário."""
        now = datetime.utcnow()
        cutoff = now - self._window
        
        if user_id not in self._requests:
            return self._limit
        
        valid_requests = [ts for ts in self._requests[user_id] if ts > cutoff]
        return max(0, self._limit - len(valid_requests))
    
    async def cleanup(self) -> None:
        """Remove entradas antigas do rate limiter."""
        async with self._lock:
            now = datetime.utcnow()
            cutoff = now - self._window
            
            users_to_remove = []
            for user_id, requests in self._requests.items():
                self._requests[user_id] = [ts for ts in requests if ts > cutoff]
                if not self._requests[user_id]:
                    users_to_remove.append(user_id)
            
            for user_id in users_to_remove:
                del self._requests[user_id]


rate_limiter = RateLimiter()
