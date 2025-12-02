import swaggerJsdoc from 'swagger-jsdoc'
import { FEATURE_CATALOG, FEATURE_KEYS } from '../modules/features/catalog'

const userProperties = {
  id: {
    type: 'string',
    format: 'uuid',
    example: '18f9c754-764e-4ea1-9f2c-59fbf5ffc111',
  },
  fullName: {
    type: 'string',
    example: 'Mariana Lopes',
  },
  login: {
    type: 'string',
    example: 'mlopes',
  },
  email: {
    type: 'string',
    format: 'email',
    example: 'mariana.lopes@example.com',
  },
  groupIds: {
    type: 'array',
    items: { type: 'string', format: 'uuid' },
    example: ['0d9a5a3b-1d2f-4cb6-9f92-4f19298d9640'],
  },
  allowFeatures: {
    type: 'array',
    description: 'Lista de funcionalidades permitidas explicitamente (chaves do catálogo)',
    items: { type: 'string', enum: FEATURE_KEYS },
    example: [],
  },
  deniedFeatures: {
    type: 'array',
    description: 'Lista de funcionalidades negadas explicitamente (chaves do catálogo)',
    items: { type: 'string', enum: FEATURE_KEYS },
    example: [],
  },
  createdBy: {
    type: 'string',
    example: 'admin',
  },
  updatedBy: {
    type: 'string',
    example: 'admin',
  },
  createdAt: {
    type: 'string',
    format: 'date-time',
    example: '2025-10-02T10:45:00Z',
  },
  updatedAt: {
    type: 'string',
    format: 'date-time',
    example: '2025-11-05T17:30:00Z',
  },
}

const accessGroupProperties = {
  id: {
    type: 'string',
    format: 'uuid',
    example: '0d9a5a3b-1d2f-4cb6-9f92-4f19298d9640',
  },
  name: {
    type: 'string',
    example: 'Administradores',
  },
  code: {
    type: 'string',
    example: 'ADM-GLOBAL',
  },
  features: {
    type: 'array',
    description: 'Funcionalidades padrão entregues por este grupo',
    items: { type: 'string', enum: FEATURE_KEYS },
    example: ['erp:usuarios:listar'],
  },
  createdBy: userProperties.createdBy,
  updatedBy: userProperties.updatedBy,
  createdAt: userProperties.createdAt,
  updatedAt: userProperties.updatedAt,
}

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'API de Usuários V2',
    version: '2.0.0',
    description:
      'Documentação do CRUD de usuários seguindo arquitetura SOLID/MVC.\n\n' +
      'Todas as rotas respondem com JSON e estão versionadas sob `/api`.\n\n' +
      '**Autenticação**: A maioria das rotas requer autenticação via Bearer Token (JWT).\n\n' +
      '**Funcionalidades e Menus**: Gerenciados via JSON estático (features.json e menus.json).',
  },
  servers: [
    {
      url: 'http://localhost:3333/api',
      description: 'Desenvolvimento local',
    },
  ],
  tags: [
    { name: 'Health', description: 'Status do serviço' },
    { name: 'Auth', description: 'Autenticação e autorização' },
    { name: 'Users', description: 'Gestão de usuários corporativos' },
    { name: 'AccessGroups', description: 'Catálogo de grupos e funcionalidades' },
    { name: 'Features', description: 'Lista estática de funcionalidades suportadas' },
    { name: 'Menus', description: 'Lista estática de menus disponíveis' },
    { name: 'Clientes', description: 'Endpoints públicos para clientes' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtido no endpoint /auth/login',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: userProperties,
      },
      CreateUserInput: {
        type: 'object',
        required: ['fullName', 'login', 'email', 'groupIds', 'createdBy'],
        properties: {
          fullName: userProperties.fullName,
          login: userProperties.login,
          email: userProperties.email,
          groupIds: userProperties.groupIds,
          password: {
            type: 'string',
            format: 'password',
            minLength: 8,
            description: 'Senha do usuário (opcional). Se fornecida, será definida diretamente sem enviar email de reset. Se não fornecida, será enviado email para definição de senha.',
            example: 'SenhaSegura@123',
          },
          allowFeatures: userProperties.allowFeatures,
          deniedFeatures: userProperties.deniedFeatures,
          createdBy: userProperties.createdBy,
        },
      },
      UpdateUserInput: {
        type: 'object',
        required: ['updatedBy'],
        properties: {
          fullName: { ...userProperties.fullName, nullable: true },
          login: { ...userProperties.login, nullable: true },
          email: { ...userProperties.email, nullable: true },
          groupIds: { ...userProperties.groupIds, nullable: true },
          allowFeatures: { ...userProperties.allowFeatures, nullable: true },
          deniedFeatures: { ...userProperties.deniedFeatures, nullable: true },
          updatedBy: userProperties.updatedBy,
        },
      },
      UpdateUserBasicInput: {
        type: 'object',
        required: ['fullName', 'login', 'email', 'updatedBy'],
        properties: {
          fullName: userProperties.fullName,
          login: userProperties.login,
          email: userProperties.email,
          updatedBy: userProperties.updatedBy,
        },
      },
      UpdateUserGroupsInput: {
        type: 'object',
        required: ['groupIds', 'updatedBy'],
        properties: {
          groupIds: userProperties.groupIds,
          updatedBy: userProperties.updatedBy,
        },
      },
      UpdateUserPermissionsInput: {
        type: 'object',
        required: ['allowFeatures', 'deniedFeatures', 'updatedBy'],
        properties: {
          allowFeatures: userProperties.allowFeatures,
          deniedFeatures: userProperties.deniedFeatures,
          updatedBy: userProperties.updatedBy,
        },
      },
      CreatePublicClientInput: {
        type: 'object',
        required: ['login', 'senha', 'email'],
        properties: {
          login: {
            type: 'string',
            example: 'cliente123',
            description: 'Login do cliente',
          },
          senha: {
            type: 'string',
            format: 'password',
            example: 'SenhaSegura@123',
            description: 'Senha do cliente',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'cliente@example.com',
            description: 'E-mail do cliente',
          },
        },
      },
      AccessGroup: {
        type: 'object',
        properties: accessGroupProperties,
      },
      CreateAccessGroupInput: {
        type: 'object',
        required: ['name', 'code', 'createdBy'],
        properties: {
          name: accessGroupProperties.name,
          code: accessGroupProperties.code,
          features: accessGroupProperties.features,
          createdBy: accessGroupProperties.createdBy,
        },
      },
      UpdateAccessGroupInput: {
        type: 'object',
        required: ['updatedBy'],
        properties: {
          name: { ...accessGroupProperties.name, nullable: true },
          code: { ...accessGroupProperties.code, nullable: true },
          features: { ...accessGroupProperties.features, nullable: true },
          updatedBy: accessGroupProperties.updatedBy,
        },
      },
      SetPasswordInput: {
        type: 'object',
        required: ['token', 'password', 'confirmPassword'],
        properties: {
          token: { type: 'string', example: 'jwt.token.aqui' },
          password: { type: 'string', minLength: 8, example: 'NovaSenhaSegura@123' },
          confirmPassword: { type: 'string', minLength: 8, example: 'NovaSenhaSegura@123' },
        },
      },
      RequestPasswordResetInput: {
        type: 'object',
        required: ['email'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'usuario@example.com',
          },
        },
      },
      ClientePasswordResetInput: {
        type: 'object',
        required: ['email'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'cliente@example.com',
          },
        },
      },
      ClientePasswordResetConfirmInput: {
        type: 'object',
        required: ['token', 'email', 'dt_nascimento', 'nova_senha'],
        properties: {
          token: { type: 'string', example: 'jwt.token.aqui' },
          email: { type: 'string', format: 'email', example: 'cliente@example.com' },
          dt_nascimento: { type: 'string', example: '01/01/1990', description: 'Formato DD/MM/AAAA' },
          nova_senha: { type: 'string', minLength: 8, example: 'NovaSenhaSegura@123' },
        },
      },
      Feature: {
        type: 'object',
        properties: {
          key: { type: 'string', enum: FEATURE_KEYS, example: FEATURE_KEYS[0] },
          name: { type: 'string', example: FEATURE_CATALOG[0]?.name ?? 'Dashboard Executivo' },
          description: {
            type: 'string',
            example:
              FEATURE_CATALOG[0]?.description ??
              'Visualização consolidada de KPIs e status em tempo real.',
          },
          'api-routes': {
            type: 'array',
            items: { type: 'string' },
            description: 'Rotas da API associadas a esta funcionalidade',
          },
        },
      },
      Menu: {
        type: 'object',
        properties: {
          key: { type: 'string', example: 'erp:usuarios:menu' },
          category: { type: 'string', example: 'Acesso' },
          name: { type: 'string', example: 'Usuários' },
          description: { type: 'string', example: 'Administração de usuários e acessos' },
          url: { type: 'string', example: '/users' },
          icon: { type: 'string', example: 'AdminPanelSettings' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string', example: 'Descrição do erro' },
          details: { type: 'object', nullable: true },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['loginOrEmail', 'password'],
        properties: {
          loginOrEmail: {
            type: 'string',
            description: 'Login ou e-mail do usuário',
            example: 'mlopes',
          },
          password: {
            type: 'string',
            format: 'password',
            description: 'Senha do usuário',
            example: 'SenhaSegura@123',
          },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            description: 'JWT access token (expira em 15 minutos). Inclui permissões do usuário.',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          refreshToken: {
            type: 'string',
            description: 'JWT refresh token (expira em 7 dias)',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              fullName: { type: 'string' },
              login: { type: 'string' },
              email: { type: 'string' },
            },
          },
        },
      },
      LogoutInput: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            description: 'Refresh token a ser invalidado',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
      RefreshTokenInput: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            description: 'Refresh token para renovar o access token',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
      RefreshTokenResponse: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            description: 'Novo JWT access token',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          refreshToken: {
            type: 'string',
            description: 'Novo JWT refresh token',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
      SearchUsersResponse: {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: { $ref: '#/components/schemas/User' },
          },
          total: { type: 'number', example: 25 },
          page: { type: 'number', example: 1 },
          limit: { type: 'number', example: 10 },
        },
      },
      SearchGroupsResponse: {
        type: 'object',
        properties: {
          groups: {
            type: 'array',
            items: { $ref: '#/components/schemas/AccessGroup' },
          },
          total: { type: 'number', example: 10 },
          page: { type: 'number', example: 1 },
          limit: { type: 'number', example: 10 },
        },
      },
      UserPermissionsResponse: {
        type: 'object',
        properties: {
          usuario: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              login: { type: 'string' },
              email: { type: 'string' },
              fullName: { type: 'string' },
            },
          },
          funcionalidades: {
            type: 'array',
            items: { type: 'string' },
            description: 'Lista de chaves de funcionalidades',
          },
          total: { type: 'number', example: 15 },
        },
      },
      CheckUrlPermissionResponse: {
        type: 'object',
        properties: {
          hasPermission: {
            type: 'boolean',
            example: true,
            description: 'Indica se o usuário tem permissão para acessar a URL',
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Verifica status da API',
        responses: {
          200: {
            description: 'Serviço operante',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Autentica um usuário e retorna tokens JWT',
        description:
          'Valida as credenciais do usuário e retorna um access token (15min) e refresh token (7 dias). ' +
          'O access token contém as permissões do usuário calculadas a partir dos grupos e funcionalidades permitidas/negadas.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Autenticação bem-sucedida',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          401: {
            description: 'Credenciais inválidas ou senha não definida',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Realiza logout invalidando o refresh token',
        description: 'Invalida o refresh token fornecido. O access token continuará válido até expirar.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LogoutInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Logout realizado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string', example: 'Logout realizado com sucesso' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Token inválido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/refresh-token': {
      post: {
        tags: ['Auth'],
        summary: 'Renova o access token usando o refresh token',
        description: 'Gera novos access e refresh tokens a partir de um refresh token válido.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Tokens renovados com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RefreshTokenResponse' },
              },
            },
          },
          401: {
            description: 'Refresh token inválido ou expirado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Renova o access token (alias para /auth/refresh-token)',
        description: 'Alias para /auth/refresh-token para compatibilidade.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Tokens renovados com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RefreshTokenResponse' },
              },
            },
          },
          401: {
            description: 'Refresh token inválido ou expirado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/check-url-permission': {
      get: {
        tags: ['Auth'],
        summary: 'Verifica se o usuário tem permissão para acessar uma URL',
        description: 'Verifica se o usuário autenticado tem permissão para acessar uma URL específica baseado em seus menus.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'url',
            required: true,
            schema: { type: 'string' },
            description: 'URL a ser verificada',
            example: '/users',
          },
        ],
        responses: {
          200: {
            description: 'Resultado da verificação',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CheckUrlPermissionResponse' },
              },
            },
          },
          400: {
            description: 'Parâmetro url é obrigatório',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          401: {
            description: 'Usuário não autenticado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'Lista usuários com filtros opcionais',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'search',
            schema: { type: 'string' },
            description: 'Filtro por nome, login ou e-mail',
          },
          {
            in: 'query',
            name: 'groupId',
            schema: { type: 'string', format: 'uuid' },
            description: 'Filtra usuários vinculados a um grupo específico (UUID)',
          },
          {
            in: 'query',
            name: 'feature',
            schema: { type: 'string' },
            description: 'Filtra usuários que possuem uma funcionalidade específica',
          },
        ],
        responses: {
          200: {
            description: 'Lista de usuários',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Cria um novo usuário',
        description: 'Cria um novo usuário. Se a senha for fornecida, ela será definida diretamente sem enviar email. Se não for fornecida, será enviado email para definição de senha.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUserInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Usuário criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          409: {
            description: 'Login ou e-mail duplicado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/users/buscar-por-texto': {
      get: {
        tags: ['Users'],
        summary: 'Busca usuários por texto com paginação',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'q',
            required: true,
            schema: { type: 'string' },
            description: 'Texto para busca (nome, login ou email)',
            example: 'mariana',
          },
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', default: 1 },
            description: 'Número da página',
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 10 },
            description: 'Itens por página',
          },
        ],
        responses: {
          200: {
            description: 'Resultado da busca paginado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SearchUsersResponse' },
              },
            },
          },
        },
      },
    },
    '/users/clientes/publico': {
      post: {
        tags: ['Users'],
        summary: 'Cria um usuário cliente publicamente (sem autenticação)',
        description: 'Endpoint público para criação de usuários do tipo cliente. Não requer autenticação.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreatePublicClientInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Cliente criado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    login: { type: 'string' },
                    email: { type: 'string' },
                    idGrupoUsuario: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          409: {
            description: 'Login ou e-mail já está em uso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/users/my-permissions': {
      get: {
        tags: ['Users'],
        summary: 'Retorna as funcionalidades do usuário logado',
        description: 'Retorna todas as funcionalidades disponíveis para o usuário autenticado.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Funcionalidades do usuário',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserPermissionsResponse' },
              },
            },
          },
          401: {
            description: 'Usuário não autenticado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/users/password/reset-request': {
      post: {
        tags: ['Users'],
        summary: 'Solicita reset de senha',
        description: 'Envia e-mail com link para redefinição de senha. Não requer autenticação.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RequestPasswordResetInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'E-mail enviado (sempre retorna sucesso por segurança)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/users/password/reset': {
      post: {
        tags: ['Users'],
        summary: 'Redefine a senha usando o token',
        description: 'Define ou redefine a senha de um usuário a partir do token enviado por e-mail. Não requer autenticação.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SetPasswordInput' },
            },
          },
        },
        responses: {
          204: {
            description: 'Senha atualizada com sucesso',
          },
          401: {
            description: 'Token inválido ou expirado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/users/{id}': {
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      get: {
        tags: ['Users'],
        summary: 'Busca detalhes de um usuário',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Usuário encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          404: {
            description: 'Usuário não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Atualiza um usuário existente (deprecated - use rotas específicas)',
        description: 'Esta rota está deprecated. Use as rotas específicas: PUT /users/:id/basic, PUT /users/:id/groups, PUT /users/:id/permissions',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Usuário atualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          404: {
            description: 'Usuário não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Remove um usuário',
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'Usuário removido' },
          404: {
            description: 'Usuário não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/users/{id}/basic': {
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      put: {
        tags: ['Users'],
        summary: 'Atualiza dados básicos do usuário',
        description: 'Atualiza apenas nome completo, login e e-mail do usuário',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserBasicInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Usuário atualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          404: {
            description: 'Usuário não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          409: {
            description: 'Login ou e-mail já está em uso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/users/{id}/groups': {
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      put: {
        tags: ['Users'],
        summary: 'Atualiza grupos de acesso do usuário',
        description: 'Atualiza apenas os grupos de acesso vinculados ao usuário',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserGroupsInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Grupos atualizados',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          404: {
            description: 'Usuário ou grupo não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/users/{id}/permissions': {
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      get: {
        tags: ['Users'],
        summary: 'Retorna as permissões de um usuário',
        description: 'Retorna todas as funcionalidades disponíveis para um usuário específico.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Permissões do usuário',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Lista de chaves de funcionalidades',
                },
              },
            },
          },
          404: {
            description: 'Usuário não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Atualiza permissões particulares do usuário',
        description: 'Atualiza apenas as funcionalidades permitidas e negadas explicitamente ao usuário',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserPermissionsInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Permissões atualizadas',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          404: {
            description: 'Usuário não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/groups': {
      get: {
        tags: ['AccessGroups'],
        summary: 'Lista grupos de acesso',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'search',
            schema: { type: 'string' },
            description: 'Busca por nome ou código',
          },
          {
            in: 'query',
            name: 'feature',
            schema: { type: 'string' },
            description: 'Filtra grupos que contem a funcionalidade informada',
          },
        ],
        responses: {
          200: {
            description: 'Lista de grupos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/AccessGroup' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['AccessGroups'],
        summary: 'Cria um novo grupo de acesso',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateAccessGroupInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Grupo criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AccessGroup' },
              },
            },
          },
          409: {
            description: 'Código duplicado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/groups/public/admin': {
      get: {
        tags: ['AccessGroups'],
        summary: 'Busca grupos admin públicos (sem autenticação)',
        description: 'Retorna grupos que contenham "ADMIN" no código. Endpoint público.',
        responses: {
          200: {
            description: 'Lista de grupos admin',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/AccessGroup' },
                },
              },
            },
          },
        },
      },
    },
    '/groups/buscar-por-texto': {
      get: {
        tags: ['AccessGroups'],
        summary: 'Busca grupos por texto com paginação',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'q',
            required: true,
            schema: { type: 'string' },
            description: 'Texto para busca (nome ou código)',
            example: 'admin',
          },
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', default: 1 },
            description: 'Número da página',
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 10 },
            description: 'Itens por página',
          },
        ],
        responses: {
          200: {
            description: 'Resultado da busca paginado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SearchGroupsResponse' },
              },
            },
          },
        },
      },
    },
    '/groups/{id}': {
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      get: {
        tags: ['AccessGroups'],
        summary: 'Busca detalhes de um grupo',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Grupo encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AccessGroup' },
              },
            },
          },
          404: {
            description: 'Grupo não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      put: {
        tags: ['AccessGroups'],
        summary: 'Atualiza um grupo existente',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateAccessGroupInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Grupo atualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AccessGroup' },
              },
            },
          },
          404: {
            description: 'Grupo não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['AccessGroups'],
        summary: 'Remove um grupo',
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'Grupo removido' },
          404: {
            description: 'Grupo não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/features': {
      get: {
        tags: ['Features'],
        summary: 'Lista o catálogo estático de funcionalidades suportadas',
        description: 'Retorna o catálogo completo de funcionalidades definidas em features.json. Não requer autenticação.',
        responses: {
          200: {
            description: 'Catálogo disponível para vinculação em usuários e grupos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Feature' },
                },
              },
            },
          },
        },
      },
    },
    '/menus': {
      get: {
        tags: ['Menus'],
        summary: 'Lista o catálogo estático de menus disponíveis',
        description: 'Retorna o catálogo completo de menus definidos em menus.json. Não requer autenticação.',
        responses: {
          200: {
            description: 'Catálogo de menus disponível',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Menu' },
                },
              },
            },
          },
        },
      },
    },
    '/clientes/auth/password/forgot': {
      post: {
        tags: ['Clientes'],
        summary: 'Solicita reset de senha para cliente',
        description: 'Envia e-mail com link para redefinição de senha para clientes. Não requer autenticação.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ClientePasswordResetInput' },
            },
          },
        },
        responses: {
          204: {
            description: 'E-mail enviado (sempre retorna sucesso por segurança)',
          },
        },
      },
    },
    '/clientes/auth/password/reset': {
      post: {
        tags: ['Clientes'],
        summary: 'Redefine a senha do cliente usando o token',
        description: 'Redefine a senha de um cliente usando token, email e data de nascimento. Não requer autenticação.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ClientePasswordResetConfirmInput' },
            },
          },
        },
        responses: {
          204: {
            description: 'Senha atualizada com sucesso',
          },
          400: {
            description: 'Dados de entrada inválidos',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          401: {
            description: 'Token inválido ou expirado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: {
            description: 'Token não válido para este email ou cliente não encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
}

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [],
}

export const swaggerSpec = swaggerJsdoc(swaggerOptions)
