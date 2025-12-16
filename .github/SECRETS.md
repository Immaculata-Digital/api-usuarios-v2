# Secrets Necessárias para Deploy

Este documento lista todas as secrets que devem ser configuradas no GitHub Actions para o deploy da API Usuários.

## Secrets de Infraestrutura (VPS)

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `VPS_HOST` | Hostname ou IP do servidor VPS | `192.168.1.100` ou `servidor.exemplo.com` |
| `VPS_USER` | Usuário SSH para acesso ao servidor | `root` ou `deploy` |
| `VPS_SSH_PRIVATE_KEY` | Chave privada SSH para autenticação | Conteúdo completo da chave privada |
| `VPS_SSH_PASSPHRASE` | Passphrase (senha) da chave privada SSH | `sua-senha-da-chave-ssh` |
| `VPS_DEPLOY_PATH` | Caminho no servidor onde o projeto será deployado | `/var/www/api-usuarios-v2` |

## Secrets de Banco de Dados

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `DB_HOST` | Hostname do banco de dados PostgreSQL | `82.112.245.233` |
| `DB_PORT` | Porta do banco de dados | `5432` |
| `DB_NAME` | Nome do banco de dados | `immaculata` |
| `DB_USER` | Usuário do banco de dados | `developer` |
| `DB_PASS` | Senha do banco de dados | `sua-senha-secreta` |

## Secrets de Segurança (JWT)

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `JWT_SECRET` | Chave secreta para assinatura dos tokens JWT | `chave-super-secreta-para-jwt` |
| `JWT_REFRESH_SECRET` | Chave secreta para refresh tokens | `chave-super-secreta-para-refresh` |
| `JWT_ISS` | Issuer (emissor) dos tokens JWT | `api-usuarios` |
| `JWT_AUD` | Audience (audiência) dos tokens JWT | `api-usuarios` |
| `JWT_ALG` | Algoritmo de assinatura JWT | `HS256` |
| `ACCESS_TOKEN_TTL` | Tempo de vida do access token | `15m` |
| `REFRESH_TOKEN_TTL` | Tempo de vida do refresh token | `7d` |

## Secrets de Configuração

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `PORT` | Porta onde a API será executada | `7772` |
| `BCRYPT_SALT_ROUNDS` | Número de rounds para hash de senha | `12` |
| `CORS_ORIGINS` | Origens permitidas para CORS (separadas por vírgula) | `*` ou `https://app.exemplo.com,https://admin.exemplo.com` |
| `LOG_LEVEL` | Nível de log da aplicação | `info` |

## Secrets de APIs Externas

| Secret | Descrição | Quando Usar |
|--------|-----------|-------------|
| `VITE_API_COMUNICACOES_BASE_URL_HOMOLOG` | URL base da API de Comunicações (Homolog) | Deploy na branch `homolog` |
| `VITE_API_COMUNICACOES_BASE_URL_MAIN` | URL base da API de Comunicações (Produção) | Deploy na branch `main` |

## Como Configurar as Secrets

1. Acesse o repositório no GitHub
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione cada secret listada acima com seu valor correspondente

## Importante

⚠️ **NUNCA** commite valores de secrets no código ou em arquivos de configuração.

⚠️ Todas as secrets são sensíveis e devem ser mantidas em segredo.

⚠️ Use valores diferentes para ambientes de homologação e produção quando aplicável.

