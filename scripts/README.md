# Scripts de Deploy

Este diretório contém scripts auxiliares para configuração e deploy da API Usuários.

## Scripts Disponíveis

### `server-setup.sh`

Script para configuração inicial do servidor VPS. Este script deve ser executado uma vez no servidor antes do primeiro deploy.

**O que faz:**
- Verifica e instala Docker (se necessário)
- Verifica e instala Docker Compose (se necessário)
- Cria o diretório de deploy (se não existir)
- Verifica se a porta 7772 está disponível
- Verifica se o container já existe

**Como usar:**
```bash
# No servidor VPS
chmod +x scripts/server-setup.sh
./scripts/server-setup.sh
```

**Variáveis de ambiente opcionais:**
- `VPS_DEPLOY_PATH`: Caminho onde o projeto será deployado (padrão: `/var/www/api-usuarios-v2`)

### `nginx-setup.sh`

Script para configuração do Nginx como reverse proxy para a API.

**O que faz:**
- Verifica e instala Nginx (se necessário)
- Cria configuração do Nginx para o ambiente especificado
- Configura reverse proxy para a API na porta 7772
- Configura SSL/HTTPS (certificados devem ser configurados manualmente)
- Recarrega o Nginx

**Como usar:**
```bash
# Para ambiente de homologação
chmod +x scripts/nginx-setup.sh
./scripts/nginx-setup.sh homolog

# Para ambiente de produção
./scripts/nginx-setup.sh main
```

**Parâmetros:**
- `homolog`: Configura para ambiente de homologação (homolog-api-usuarios.immaculatadigital.com.br)
- `main` ou `production`: Configura para ambiente de produção (api-usuarios.immaculatadigital.com.br)

**Variáveis de ambiente opcionais:**
- `DEPLOY_ENV`: Ambiente de deploy (homolog ou main)

**Notas importantes:**
- Os certificados SSL devem ser configurados manualmente após executar o script
- O script cria a configuração mas não configura SSL automaticamente
- Use Let's Encrypt (certbot) para obter certificados SSL gratuitos

**Exemplo de configuração SSL:**
```bash
# Após executar o script, configure SSL com Let's Encrypt
certbot --nginx -d homolog-api-usuarios.immaculatadigital.com.br
```

## Ordem de Execução

1. **Primeira vez no servidor:**
   ```bash
   # 1. Execute o setup do servidor
   ./scripts/server-setup.sh
   
   # 2. Execute o setup do Nginx (para homolog ou main)
   ./scripts/nginx-setup.sh homolog
   # ou
   ./scripts/nginx-setup.sh main
   
   # 3. Configure SSL (se necessário)
   certbot --nginx -d homolog-api-usuarios.immaculatadigital.com.br
   ```

2. **Deploys subsequentes:**
   - Os deploys são feitos automaticamente via GitHub Actions quando há push nas branches `homolog` ou `main`
   - Não é necessário executar os scripts novamente

## Troubleshooting

### Porta 7772 já está em uso
```bash
# Verifique qual processo está usando a porta
sudo lsof -i :7772

# Pare o container antigo
docker stop api-usuarios
docker rm api-usuarios
```

### Nginx não recarrega
```bash
# Teste a configuração
sudo nginx -t

# Recarregue manualmente
sudo systemctl reload nginx
# ou
sudo service nginx reload
```

### Container não inicia
```bash
# Verifique os logs
docker logs api-usuarios

# Verifique se a imagem foi construída
docker images | grep api-usuarios
```

