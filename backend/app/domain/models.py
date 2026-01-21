"""
Modelos de domínio da aplicação.
"""
from pydantic import BaseModel, Field
from typing import Optional


class ClienteInfo(BaseModel):
    """Informações do cliente retornadas na consulta."""
    cnpj: str = Field(..., description="CNPJ formatado (14 dígitos)")
    razao_social: str = Field(..., description="Razão social da empresa")
    responsavel: str = Field(..., description="Responsável pela conta")
    status_conta: str = Field(..., description="Status atual da conta")


class ConsultaResponse(BaseModel):
    """Resposta da consulta de CNPJ."""
    encontrado: bool = Field(..., description="Indica se o CNPJ foi encontrado")
    cliente: Optional[ClienteInfo] = Field(None, description="Dados do cliente, se encontrado")
    mensagem: Optional[str] = Field(None, description="Mensagem de erro ou informação")


class ErrorResponse(BaseModel):
    """Resposta de erro padrão."""
    detail: str = Field(..., description="Descrição do erro")


class HealthResponse(BaseModel):
    """Resposta do health check."""
    status: str = "healthy"
    cache_loaded: bool = False
    cache_size: int = 0
