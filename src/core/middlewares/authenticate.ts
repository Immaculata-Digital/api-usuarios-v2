import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, type AuthTokenPayload } from '../utils/jwt'
import { AppError } from '../errors/AppError'

// Estender o tipo Request para incluir informações do usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload
    }
  }
}

/**
 * Lista de rotas públicas que não precisam de autenticação
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
  '/users/password/reset-request',
  '/api/users/password/reset-request',
  '/users/password/reset',
  '/api/users/password/reset',
  '/users/clientes/publico',
  '/api/users/clientes/publico',
  '/groups/public/admin',
  '/api/groups/public/admin',
  '/clientes/auth/password/forgot',
  '/api/clientes/auth/password/forgot',
  '/clientes/auth/password/reset',
  '/api/clientes/auth/password/reset',
  '/docs',
  '/api/docs',
]

/**
 * Verifica se uma rota é pública
 */
const isPublicRoute = (path: string): boolean => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return PUBLIC_ROUTES.some((publicRoute) => normalizedPath.startsWith(publicRoute))
}

/**
 * Middleware de autenticação
 * Valida o access token e adiciona as informações do usuário ao request
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Se for uma rota pública, permite o acesso sem autenticação
    if (isPublicRoute(req.path)) {
      return next()
    }

    const authHeader = req.headers.authorization

    if (!authHeader) {
      throw new AppError('Token de autenticação não fornecido', 401)
    }

    const [scheme, token] = authHeader.split(' ')

    if (scheme !== 'Bearer' || !token) {
      throw new AppError('Formato de token inválido. Use: Bearer <token>', 401)
    }

    const payload = verifyAccessToken(token)
    req.user = payload

    next()
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ status: 'error', message: error.message })
    }
    return res.status(401).json({ status: 'error', message: 'Token inválido ou expirado' })
  }
}

