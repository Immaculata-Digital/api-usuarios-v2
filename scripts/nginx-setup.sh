#!/bin/bash

# Script de setup do Nginx para API Usuários
# Este script configura o Nginx como reverse proxy para a API

set -e

echo "🚀 Iniciando setup do Nginx para API Usuarios..."

# Verifica se o Nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx não está instalado. Instalando Nginx..."
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        apt-get update
        apt-get install -y nginx
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        yum install -y nginx
    else
        echo "❌ Sistema operacional não suportado. Instale o Nginx manualmente."
        exit 1
    fi
    echo "✅ Nginx instalado com sucesso"
else
    echo "✅ Nginx já está instalado"
fi

# Configuração do Nginx
NGINX_CONFIG_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"

# Cria diretórios se não existirem (para sistemas que não usam sites-available/enabled)
if [ ! -d "$NGINX_CONFIG_DIR" ]; then
    mkdir -p "$NGINX_CONFIG_DIR"
fi
if [ ! -d "$NGINX_ENABLED_DIR" ]; then
    mkdir -p "$NGINX_ENABLED_DIR"
fi

# Determina o ambiente (homolog ou main) baseado no argumento ou variável de ambiente
ENVIRONMENT="${1:-${DEPLOY_ENV:-homolog}}"

if [ "$ENVIRONMENT" = "homolog" ]; then
    SERVER_NAME="homolog-api-usuarios.immaculatadigital.com.br"
    UPSTREAM_PORT="7772"
elif [ "$ENVIRONMENT" = "main" ] || [ "$ENVIRONMENT" = "production" ]; then
    SERVER_NAME="api-usuarios.immaculatadigital.com.br"
    UPSTREAM_PORT="7772"
else
    echo "❌ Ambiente inválido: $ENVIRONMENT. Use 'homolog' ou 'main'"
    exit 1
fi

CONFIG_FILE="$NGINX_CONFIG_DIR/api-usuarios-$ENVIRONMENT.conf"

echo "📝 Criando configuração do Nginx para $ENVIRONMENT..."
cat > "$CONFIG_FILE" <<EOF
# Configuração do Nginx para API Usuários - $ENVIRONMENT
server {
    listen 80;
    server_name $SERVER_NAME;

    # Redireciona HTTP para HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $SERVER_NAME;

    # Certificados SSL (ajuste os caminhos conforme necessário)
    # ssl_certificate /etc/letsencrypt/live/$SERVER_NAME/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$SERVER_NAME/privkey.pem;

    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logs
    access_log /var/log/nginx/api-usuarios-$ENVIRONMENT-access.log;
    error_log /var/log/nginx/api-usuarios-$ENVIRONMENT-error.log;

    # Tamanho máximo do body
    client_max_body_size 10M;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Headers
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;

    # Proxy para a API
    location / {
        proxy_pass http://localhost:$UPSTREAM_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check
    location /api/health {
        proxy_pass http://localhost:$UPSTREAM_PORT/api/health;
        access_log off;
    }

    # Documentação Swagger
    location /docs {
        proxy_pass http://localhost:$UPSTREAM_PORT/docs;
    }
}
EOF

echo "✅ Configuração criada: $CONFIG_FILE"

# Cria link simbólico se não existir
LINK_FILE="$NGINX_ENABLED_DIR/api-usuarios-$ENVIRONMENT.conf"
if [ ! -L "$LINK_FILE" ]; then
    ln -s "$CONFIG_FILE" "$LINK_FILE"
    echo "✅ Link simbólico criado"
else
    echo "✅ Link simbólico já existe"
fi

# Testa a configuração do Nginx
echo "🧪 Testando configuração do Nginx..."
if nginx -t; then
    echo "✅ Configuração do Nginx está válida"
    
    # Recarrega o Nginx
    echo "🔄 Recarregando Nginx..."
    systemctl reload nginx || service nginx reload
    echo "✅ Nginx recarregado com sucesso"
else
    echo "❌ Erro na configuração do Nginx. Verifique os logs."
    exit 1
fi

echo ""
echo "✅ Setup do Nginx concluído!"
echo ""
echo "📝 Configuração criada para: $SERVER_NAME"
echo "📝 Arquivo de configuração: $CONFIG_FILE"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Configure os certificados SSL (Let's Encrypt recomendado)"
echo "   2. Descomente as linhas ssl_certificate no arquivo de configuração"
echo "   3. Ajuste o server_name se necessário"
echo ""
echo "   Para configurar SSL com Let's Encrypt:"
echo "   certbot --nginx -d $SERVER_NAME"

