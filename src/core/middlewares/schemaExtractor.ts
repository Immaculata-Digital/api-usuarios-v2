import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError'

const VALID_SCHEMA = /^[a-zA-Z_][a-zA-Z0-9_]*$/

declare global {
  namespace Express {
    interface Request {
      schema?: string
    }
  }
}

/**
 * Middleware para extrair o schema do header X-Schema
 * Para rotas relacionadas a usuários, o schema é obrigatório
 */
export const schemaExtractor = (req: Request, res: Response, next: NextFunction) => {
  const schema = req.headers['x-schema'] as string | undefined

  // Obtém o path completo (incluindo /api se aplicável)
  const fullPath = req.baseUrl + req.path
  const pathToCheck = fullPath || req.path

  // Para rotas de usuários, schema é obrigatório (exceto rotas públicas de reset de senha)
  const isPublicUserRoute = pathToCheck.includes('/password/reset') || pathToCheck.includes('/password/reset-request') || pathToCheck.includes('/clientes/publico')
  const isPublicGroupRoute = pathToCheck.includes('/groups/public/grupo/')
  const isUserRoute = pathToCheck.includes('/users') || pathToCheck.includes('/password/reset-request') || pathToCheck.includes('/password/reset')
  const isGroupRoute = pathToCheck.includes('/groups')
  
  // Para rotas de grupos que precisam de schema (exceto rotas públicas específicas)
  if (isGroupRoute && !isPublicGroupRoute && !pathToCheck.includes('/public/admin')) {
    if (!schema) {
      return res.status(400).json({
        status: 'error',
        message: 'Header X-Schema é obrigatório para rotas de grupos',
      })
    }

    if (!VALID_SCHEMA.test(schema)) {
      return res.status(400).json({
        status: 'error',
        message: 'Schema inválido. Use apenas letras, números e underscore, iniciando com letra ou underscore',
      })
    }
  }
  
  if (!isPublicUserRoute && isUserRoute) {
    if (!schema) {
      return res.status(400).json({
        status: 'error',
        message: 'Header X-Schema é obrigatório para rotas de usuários',
      })
    }

    if (!VALID_SCHEMA.test(schema)) {
      return res.status(400).json({
        status: 'error',
        message: 'Schema inválido. Use apenas letras, números e underscore, iniciando com letra ou underscore',
      })
    }
  }

  // Adicionar schema ao request se estiver presente
  if (schema && VALID_SCHEMA.test(schema)) {
    req.schema = schema
  }

  next()
}

