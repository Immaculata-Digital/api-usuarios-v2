import type { Request, Response, NextFunction } from 'express'
import { routeAuthorizationService } from '../../modules/features/services/RouteAuthorizationService'
import { AppError } from '../errors/AppError'

/**
 * Lista de rotas públicas que não precisam de autorização
 * As rotas podem vir com ou sem o prefixo /api
 */
const PUBLIC_ROUTES = [
  '/health',
  '/api/health',
  '/auth/login',
  '/api/auth/login',
  '/auth/logout',
  '/api/auth/logout',
  '/auth/refresh-token',
  '/api/auth/refresh-token',
  '/auth/refresh',
  '/api/auth/refresh',
  // Rotas públicas de redefinição de senha (não requerem autenticação)
  '/users/password/reset-request',
  '/api/users/password/reset-request',
  '/users/password/reset',
  '/api/users/password/reset',
  '/users/clientes/publico',
  '/api/users/clientes/publico',
  '/groups/public/admin',
  '/api/groups/public/admin',
  '/groups/public/grupo/',
  '/api/groups/public/grupo/',
  '/clientes/auth/password/forgot',
  '/api/clientes/auth/password/forgot',
  '/clientes/auth/password/reset',
  '/api/clientes/auth/password/reset',
  '/docs',
  '/api/docs',
]

/**
 * Verifica se uma rota é pública
 * Verifica tanto o path relativo quanto o path completo (com /api)
 */
const isPublicRoute = (req: Request): boolean => {
  // Obtém o path completo (incluindo /api se aplicável)
  const fullPath = req.baseUrl + req.path
  // Remove query string se houver
  const pathWithoutQuery = fullPath.split('?')[0] || ''
  // Normaliza o path
  const normalizedFullPath = pathWithoutQuery.startsWith('/') ? pathWithoutQuery : `/${pathWithoutQuery}`
  
  // Também verifica o path relativo (sem /api)
  const normalizedPath = req.path.startsWith('/') ? req.path : `/${req.path}`
  
  // Verifica se algum dos paths corresponde a uma rota pública
  return PUBLIC_ROUTES.some((publicRoute) => 
    normalizedFullPath.startsWith(publicRoute) || normalizedPath.startsWith(publicRoute)
  )
}

/**
 * Middleware de autorização baseado em rotas
 * Verifica se o usuário autenticado tem acesso à rota solicitada
 * baseado nas features definidas no features.json
 */
export const routeAuthorization = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Se for uma rota pública, permite o acesso sem verificação
    if (isPublicRoute(req)) {
      return next()
    }

    // Se não houver usuário autenticado, retorna erro
    // (o middleware authenticate deve ser aplicado antes deste)
    if (!req.user) {
      throw new AppError('Usuário não autenticado', 401)
    }

    // Obtém as permissões do usuário do token
    const userPermissions = req.user.permissions || []

    // Obtém informações da requisição
    const host = req.get('host')
    const origin = req.get('origin')
    const method = req.method
    const route = req.path

    // Verifica se o usuário tem acesso à rota
    const { hasAccess, requiredFeatures } = routeAuthorizationService.checkRouteAccess(
      userPermissions,
      host,
      origin,
      method,
      route,
    )

    // Se não tiver acesso, retorna erro 403
    if (!hasAccess) {
      return res.status(403).json({
        status: 'error',
        message: 'Acesso negado. Você não tem permissão para acessar esta rota.',
        requiredFeatures,
        userPermissions,
        route: {
          api: routeAuthorizationService.identifyApi(host, origin),
          method,
          path: route,
        },
      })
    }

    // Se tiver acesso, continua para o próximo middleware
    next()
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ status: 'error', message: error.message })
    }
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao verificar autorização da rota',
    })
  }
}

