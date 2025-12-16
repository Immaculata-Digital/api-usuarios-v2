#!/bin/bash

# Script de setup do servidor para API Usuários
# Este script deve ser executado no servidor VPS para configurar o ambiente

set -e

echo "🚀 Iniciando setup do servidor para API Usuários..."

# Verifica se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "✅ Docker instalado com sucesso"
else
    echo "✅ Docker já está instalado"
fi

# Verifica se o Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Instalando Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose instalado com sucesso"
else
    echo "✅ Docker Compose já está instalado"
fi

# Verifica se o diretório do projeto existe
DEPLOY_PATH="${VPS_DEPLOY_PATH:-/var/www/api-usuarios-v2}"
if [ ! -d "$DEPLOY_PATH" ]; then
    echo "📁 Criando diretório de deploy: $DEPLOY_PATH"
    mkdir -p "$DEPLOY_PATH"
    echo "✅ Diretório criado"
else
    echo "✅ Diretório de deploy já existe: $DEPLOY_PATH"
fi

# Verifica se o container está rodando
if docker ps -a | grep -q "api-usuarios"; then
    echo "⚠️  Container api-usuarios já existe"
    echo "   Para recriar, execute: docker stop api-usuarios && docker rm api-usuarios"
else
    echo "✅ Nenhum container api-usuarios encontrado (pronto para primeiro deploy)"
fi

# Verifica se a porta 7772 está disponível
if lsof -Pi :7772 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Porta 7772 já está em uso"
else
    echo "✅ Porta 7772 está disponível"
fi

echo ""
echo "✅ Setup do servidor concluído!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Configure as secrets no GitHub Actions"
echo "   2. Faça push para a branch homolog ou main"
echo "   3. O deploy será executado automaticamente via GitHub Actions"

