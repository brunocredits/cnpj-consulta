"""
Aplicação principal FastAPI.
CNPJ Consulta API - Sistema seguro de consulta pontual por CNPJ.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import health_router, consulta_router, auth_router
from app.datasources import ploomes_datasource

# Configuração de logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia ciclo de vida da aplicação."""
    logger.info("Iniciando aplicação...")
    
    # Pré-carrega o cache na inicialização
    try:
        await ploomes_datasource.refresh_cache()
        logger.info("Cache inicial carregado com sucesso")
    except Exception as e:
        logger.warning(f"Falha ao carregar cache inicial: {e}")
    
    yield
    
    # Cleanup
    logger.info("Encerrando aplicação...")
    await ploomes_datasource.close()


app = FastAPI(
    title="CNPJ Consulta API",
    description="API segura para consulta pontual de informações por CNPJ",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS - permite múltiplas origens
cors_origins = [
    settings.frontend_url,
    # Produção (Vercel)
    "https://cnpj-consulta.vercel.app",
    "https://creditsbrasil.vercel.app",
    # Aceita qualquer subdomínio do Vercel
    "https://*.vercel.app",
    # Desenvolvimento local
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
    "http://127.0.0.1:5177",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Routers
app.include_router(health_router)
app.include_router(consulta_router)
app.include_router(auth_router)


@app.get("/", include_in_schema=False)
async def root():
    """Redireciona para documentação."""
    return {"message": "CNPJ Consulta API", "docs": "/docs"}
