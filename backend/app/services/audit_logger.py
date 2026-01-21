"""
Logger de auditoria para registrar consultas.
Registra apenas: email, timestamp, CNPJ consultado.
"""
import logging
from datetime import datetime
from typing import Optional
import json

logger = logging.getLogger("audit")


class AuditLogger:
    """Logger de auditoria para consultas de CNPJ."""
    
    def __init__(self):
        self._setup_audit_logger()
    
    def _setup_audit_logger(self) -> None:
        """Configura o logger de auditoria separado."""
        audit_handler = logging.FileHandler("audit.log", encoding="utf-8")
        audit_handler.setLevel(logging.INFO)
        
        formatter = logging.Formatter(
            '%(asctime)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        audit_handler.setFormatter(formatter)
        
        if not logger.handlers:
            logger.addHandler(audit_handler)
            logger.setLevel(logging.INFO)
    
    def log_consulta(
        self,
        user_email: str,
        cnpj: str,
        encontrado: bool,
        ip_address: Optional[str] = None
    ) -> None:
        """
        Registra uma consulta de CNPJ.
        
        Args:
            user_email: Email do usuário que fez a consulta.
            cnpj: CNPJ consultado (normalizado).
            encontrado: Se o CNPJ foi encontrado.
            ip_address: IP do cliente (opcional).
        """
        audit_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_email": user_email,
            "cnpj": cnpj,
            "encontrado": encontrado,
            "ip_address": ip_address
        }
        
        logger.info(json.dumps(audit_record, ensure_ascii=False))
    
    def log_auth_failure(
        self,
        reason: str,
        ip_address: Optional[str] = None
    ) -> None:
        """Registra falha de autenticação."""
        audit_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "event": "auth_failure",
            "reason": reason,
            "ip_address": ip_address
        }
        
        logger.info(json.dumps(audit_record, ensure_ascii=False))


audit_logger = AuditLogger()
