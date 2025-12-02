# API Usuários V2

API de usuários seguindo arquitetura SOLID/MVC em TypeScript, baseada na arquitetura do marshall-workspace.

## 🏗️ Arquitetura

A API segue uma arquitetura modular baseada em:

- **SOLID Principles**: Separação de responsabilidades, inversão de dependências
- **Clean Architecture**: Camadas bem definidas (entities, use cases, repositories, controllers)
- **Modular Design**: Módulos independentes (users, accessGroups, auth, features, menus)

## 📁 Estrutura de Pastas

```
src/
├── config/              # Configurações (env.ts)
├── core/                # Funcionalidades core
│   ├── errors/          # Classes de erro customizadas
│   ├── middlewares/     # Middlewares globais (auth, error handling, logging)
│   └── utils/           # Utilitários (JWT, password, normalize)
├── docs/                # Documentação Swagger
├── infra/               # Infraestrutura
│   └── database/        # Pool de conexão PostgreSQL
├── modules/             # Módulos da aplicação
│   ├── accessGroups/    # Grupos de acesso
│   ├── auth/            # Autenticação e autorização
│   ├── features/        # Catálogo de funcionalidades (JSON)
│   ├── menus/           # Catálogo de menus (JSON)
│   └── users/           # Gestão de usuários
└── routes/              # Rotas principais
```

## 🚀 Como Usar

### Instalação

```bash
npm install
```

### Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=immaculata
DB_USER=developer
DB_PASS=sua_senha

# Security
JWT_SECRET=seu_jwt_secret_aqui
JWT_EXPIRES_IN=2h
CRYPTO_SECRET=seu_crypto_secret_aqui

# App
PORT=3333
NODE_ENV=development
APP_WEB_URL=http://localhost:5173
PASSWORD_RESET_PATH=/account/set-password

# APIs Externas
API_COMUNICACOES_URL=http://localhost:3334/api
```

### Executar

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start
```

## 📚 Funcionalidades

### Autenticação
- Login com JWT (access token + refresh token)
- Refresh token automático
- Logout

### Usuários
- CRUD completo de usuários
- Atribuição de grupos de acesso
- Permissões particulares (allow/deny features)
- Reset de senha por e-mail

### Grupos de Acesso
- CRUD de grupos
- Vinculação de funcionalidades aos grupos
- Múltiplos grupos por usuário

### Funcionalidades e Menus
- Catálogo estático em JSON (`features.json`, `menus.json`)
- Autorização baseada em features
- Rotas protegidas por funcionalidades

## 🔐 Sistema de Permissões

O sistema de permissões funciona em camadas:

1. **Grupos de Acesso**: Funcionalidades padrão por grupo
2. **Permissões Particulares**: Allow/Deny features específicas por usuário
3. **Cálculo Final**: Permissões dos grupos + allow - denied

## 📖 Documentação

Acesse a documentação Swagger em:
- Desenvolvimento: `http://localhost:3333/docs`

## 🗄️ Migrations

As migrations são gerenciadas pelo projeto `db-migrations` separado.

Para executar migrations:
```bash
cd ../db-migrations
npm run dev
# POST http://localhost:3444/api/migrations/run
# Body: { "direction": "up" }
```

## 🔄 Integração com Apps

Os apps `app-admin` e `app-cliente` foram configurados para usar esta API através da variável de ambiente:

```env
VITE_API_HOMOLOG_USUARIOS_V2_URL=http://localhost:3333/api
```

Ou use a variável antiga como fallback:
```env
VITE_API_HOMOLOG_USUARIOS_URL=http://localhost:3333/api
```

