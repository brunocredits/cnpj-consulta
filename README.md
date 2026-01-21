# 🔍 CNPJ Consulta - Credits Brasil

Sistema web seguro para consulta pontual de informações de clientes por CNPJ.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-green.svg)
![React](https://img.shields.io/badge/react-18.2-blue.svg)

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Requisitos de Segurança](#-requisitos-de-segurança)
- [Configuração do Azure Entra ID](#-configuração-do-azure-entra-id)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Instalação Local](#-instalação-local)
- [Deploy no Azure App Service](#-deploy-no-azure-app-service)
- [Estrutura do Projeto](#-estrutura-do-projeto)

---

## 🎯 Visão Geral

### Funcionalidades

- ✅ Consulta pontual por CNPJ
- ✅ Autenticação corporativa via Microsoft Entra ID
- ✅ Acesso restrito ao domínio @creditsbrasil.com.br
- ✅ Rate limiting por usuário (30 req/min)
- ✅ Cache em memória com TTL configurável
- ✅ Logging/auditoria de consultas
- ✅ Interface moderna e responsiva

### O que é retornado

- **Razão Social**
- **Responsável**
- **Status da Conta**

Se o CNPJ não existir: *"Esse cliente não está disponível no Serasa"*

---

## 🏗 Arquitetura

```
┌─────────────────┐     HTTPS/JWT    ┌─────────────────┐     HTTPS     ┌─────────────────┐
│                 │ ◄──────────────► │                 │ ◄───────────► │                 │
│    Frontend     │                  │     Backend     │               │  Ploomes API    │
│   (React/Vite)  │                  │    (FastAPI)    │               │   (Callbacks)   │
│                 │                  │                 │               │                 │
└────────┬────────┘                  └────────┬────────┘               └─────────────────┘
         │                                    │
         │  OAuth2/OIDC                       │  Cache em Memória
         ▼                                    ▼
┌─────────────────┐                  ┌─────────────────┐
│  Microsoft      │                  │  Índice CNPJ    │
│  Entra ID       │                  │  (TTL: 10 min)  │
└─────────────────┘                  └─────────────────┘
```

### Fluxo de Autenticação

1. Usuário acessa o frontend
2. Redireciona para login Microsoft
3. Após autenticação, recebe token JWT
4. Frontend envia token em cada requisição
5. Backend valida JWT via JWKS do Azure
6. Verifica se email é @creditsbrasil.com.br
7. Processa a consulta se autorizado

### Fluxo de Dados

1. Backend carrega dados dos callbacks na inicialização
2. Mescla CALLBACK_1 e CALLBACK_2 (CALLBACK_2 tem prioridade)
3. Cria índice em memória por CNPJ normalizado
4. Cache expira após TTL (padrão: 10 minutos)
5. Consultas buscam direto no índice O(1)

---

## 🔐 Requisitos de Segurança

| Requisito | Implementação |
|-----------|---------------|
| Autenticação | Microsoft Entra ID (OAuth2/OIDC) |
| Autorização | Validação JWT + domínio @creditsbrasil.com.br |
| Rate Limiting | 30 requisições/minuto por usuário |
| Auditoria | Log de email, timestamp e CNPJ consultado |
| Dados | Apenas campos mínimos retornados |
| Callbacks | Variáveis de ambiente (nunca hardcoded) |
| Lista completa | **NUNCA** exposta - apenas consulta pontual |

---

## ⚙ Configuração do Azure Entra ID

### Passo 1: Registrar a Aplicação

1. Acesse o [Portal Azure](https://portal.azure.com)
2. Navegue para **Microsoft Entra ID** > **Registros de aplicativo**
3. Clique em **Novo registro**
4. Preencha:
   - **Nome**: `CNPJ Consulta - Credits Brasil`
   - **Tipos de conta suportados**: `Contas somente neste diretório organizacional`
   - **URI de redirecionamento**: 
     - Tipo: `SPA`
     - URL: `http://localhost:5173` (desenvolvimento)
5. Clique em **Registrar**

### Passo 2: Configurar a Aplicação

1. Anote o **ID do aplicativo (cliente)** = `CLIENT_ID`
2. Anote o **ID do diretório (locatário)** = `TENANT_ID`
3. Vá em **Autenticação**:
   - Adicione URI de redirecionamento de produção
   - Marque **Tokens de acesso** e **Tokens de ID**
   - Salve

### Passo 3: Expor uma API

1. Vá em **Expor uma API**
2. Clique em **Definir** ao lado de "URI da ID do Aplicativo"
3. Aceite o padrão: `api://{client-id}`
4. Clique em **Adicionar um escopo**:
   - Nome do escopo: `access_as_user`
   - Quem pode consentir: `Administradores e usuários`
   - Nome de exibição: `Acessar API de Consulta CNPJ`
   - Descrição: `Permite consultar CNPJs na API`
5. Salve

### Passo 4: Restringir ao Domínio (Opcional)

Para garantir que apenas usuários @creditsbrasil.com.br possam acessar:

1. Vá em **Propriedades da Empresa**
2. Marque **Atribuição de usuário necessária?** = Sim
3. Em **Usuários e grupos**, adicione apenas os grupos/usuários permitidos

> **Nota**: O backend também valida o domínio do email no código.

---

## 📝 Variáveis de Ambiente

### Backend (.env)

```env
# Azure Entra ID
TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ALLOWED_DOMAIN=creditsbrasil.com.br

# Callbacks Ploomes (URLs secretas)
PLOOMES_CALLBACK_1=https://pbi.ploomes.com/powerbi/callback/...
PLOOMES_CALLBACK_2=https://pbi.ploomes.com/powerbi/callback/...

# Cache
CACHE_TTL_SECONDS=600

# Rate Limiting
RATE_LIMIT_PER_MINUTE=30

# HTTP Client
HTTP_TIMEOUT_SECONDS=30
HTTP_MAX_RETRIES=3

# CORS
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=INFO
```

### Frontend (.env)

```env
# Azure Entra ID
VITE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# API (deixe vazio para usar proxy em desenvolvimento)
VITE_API_URL=
```

---

## 🚀 Instalação Local

### Pré-requisitos

- Python 3.11+
- Node.js 18+
- npm ou yarn

### Backend

```bash
# Navegar para a pasta do backend
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual (Windows)
venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Copiar e configurar variáveis de ambiente
copy .env.example .env
# Edite o arquivo .env com seus valores

# Iniciar servidor de desenvolvimento
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

O backend estará disponível em: `http://localhost:8000`
- Documentação Swagger: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### Frontend

```bash
# Navegar para a pasta do frontend
cd frontend

# Instalar dependências
npm install

# Copiar e configurar variáveis de ambiente
copy .env.example .env
# Edite o arquivo .env com seus valores

# Iniciar servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em: `http://localhost:5173`

---

## ☁ Deploy no Azure App Service

### Backend (Python)

#### 1. Criar App Service

```bash
# Login no Azure CLI
az login

# Criar Resource Group
az group create --name rg-cnpj-consulta --location eastus2

# Criar App Service Plan
az appservice plan create \
  --name plan-cnpj-consulta \
  --resource-group rg-cnpj-consulta \
  --sku B1 \
  --is-linux

# Criar Web App
az webapp create \
  --name cnpj-consulta-api \
  --resource-group rg-cnpj-consulta \
  --plan plan-cnpj-consulta \
  --runtime "PYTHON:3.11"
```

#### 2. Configurar Variáveis de Ambiente

```bash
az webapp config appsettings set \
  --name cnpj-consulta-api \
  --resource-group rg-cnpj-consulta \
  --settings \
    TENANT_ID="seu-tenant-id" \
    CLIENT_ID="seu-client-id" \
    ALLOWED_DOMAIN="creditsbrasil.com.br" \
    PLOOMES_CALLBACK_1="url-callback-1" \
    PLOOMES_CALLBACK_2="url-callback-2" \
    CACHE_TTL_SECONDS="600" \
    RATE_LIMIT_PER_MINUTE="30" \
    FRONTEND_URL="https://cnpj-consulta-web.azurewebsites.net"
```

#### 3. Configurar Startup Command

```bash
az webapp config set \
  --name cnpj-consulta-api \
  --resource-group rg-cnpj-consulta \
  --startup-file "gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker"
```

#### 4. Deploy via Git

```bash
# Configurar deployment source
az webapp deployment source config-local-git \
  --name cnpj-consulta-api \
  --resource-group rg-cnpj-consulta

# Adicionar remote e fazer push
cd backend
git init
git add .
git commit -m "Initial commit"
git remote add azure <url-retornada>
git push azure main
```

### Frontend (Node.js Static)

#### 1. Build do Projeto

```bash
cd frontend
npm run build
```

#### 2. Criar Static Web App

```bash
az staticwebapp create \
  --name cnpj-consulta-web \
  --resource-group rg-cnpj-consulta \
  --source frontend \
  --location eastus2 \
  --branch main \
  --output-location dist \
  --login-with-github
```

#### 3. Configurar Variáveis

No Portal Azure:
1. Acesse o Static Web App
2. Vá em **Configuration**
3. Adicione as variáveis:
   - `VITE_TENANT_ID`
   - `VITE_CLIENT_ID`
   - `VITE_API_URL` = URL do backend

#### 4. Atualizar Redirect URIs

No Portal Azure > Entra ID > Registro de Aplicativo:
1. Vá em **Autenticação**
2. Adicione a URL de produção do frontend
3. Salve

---

## 📁 Estrutura do Projeto

```
Front/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # Aplicação FastAPI
│   │   ├── config/
│   │   │   ├── __init__.py
│   │   │   └── settings.py      # Configurações (env vars)
│   │   ├── domain/
│   │   │   ├── __init__.py
│   │   │   └── models.py        # Modelos Pydantic
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py  # Validação JWT Entra ID
│   │   │   ├── cache_service.py # Cache em memória
│   │   │   ├── rate_limiter.py  # Rate limiting
│   │   │   └── audit_logger.py  # Logging de auditoria
│   │   ├── datasources/
│   │   │   ├── __init__.py
│   │   │   └── ploomes_datasource.py  # Fetch dos callbacks
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── health.py        # GET /health
│   │       ├── consulta.py      # GET /api/consulta
│   │       └── dependencies.py  # Dependências de auth
│   ├── .env.example
│   ├── .gitignore
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── main.tsx             # Entry point
│   │   ├── App.tsx              # Componente principal
│   │   ├── index.css            # Estilos globais
│   │   ├── vite-env.d.ts
│   │   ├── config/
│   │   │   ├── authConfig.ts    # Configuração MSAL
│   │   │   └── apiConfig.ts     # Configuração API
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx    # Tela de login
│   │   │   └── ConsultaPage.tsx # Tela de consulta
│   │   ├── components/
│   │   │   ├── Header.tsx       # Cabeçalho com logout
│   │   │   ├── ResultCard.tsx   # Card de resultado
│   │   │   └── LoadingSpinner.tsx
│   │   └── services/
│   │       └── apiService.ts    # Chamadas à API
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
└── README.md
```

---

## 🧪 Testando a Aplicação

### Health Check

```bash
curl http://localhost:8000/health
```

Resposta:
```json
{
  "status": "healthy",
  "cache_loaded": true,
  "cache_size": 1234
}
```

### Consulta (requer token)

```bash
curl -H "Authorization: Bearer <seu-token>" \
  "http://localhost:8000/api/consulta?cnpj=12345678000199"
```

Resposta (encontrado):
```json
{
  "encontrado": true,
  "cliente": {
    "cnpj": "12345678000199",
    "razao_social": "EMPRESA EXEMPLO LTDA",
    "responsavel": "João Silva",
    "status_conta": "Ativo"
  }
}
```

Resposta (não encontrado):
```json
{
  "encontrado": false,
  "mensagem": "Esse cliente não está disponível no Serasa"
}
```

---

## 📊 Logs de Auditoria

Os logs são salvos em `backend/audit.log`:

```json
{"timestamp": "2026-01-21T10:30:00", "user_email": "usuario@creditsbrasil.com.br", "cnpj": "12345678000199", "encontrado": true, "ip_address": "192.168.1.1"}
```

---

## 🛡 Troubleshooting

| Problema | Solução |
|----------|---------|
| Token inválido | Verifique TENANT_ID e CLIENT_ID |
| Domínio não autorizado | Confirme que o email termina com @creditsbrasil.com.br |
| Rate limit excedido | Aguarde 1 minuto ou aumente RATE_LIMIT_PER_MINUTE |
| Cache vazio | Verifique se os callbacks estão acessíveis |
| CORS error | Confirme FRONTEND_URL no backend |

---

## 📄 Licença

Uso interno - Credits Brasil Gestão e Inteligência de Dados Ltda.

---

**Desenvolvido com ❤️ para Credits Brasil**
