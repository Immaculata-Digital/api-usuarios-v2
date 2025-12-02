import type { Request, Response } from 'express'
import { z } from 'zod'
import { LoginUseCase } from '../useCases/login/LoginUseCase'
import { LogoutUseCase } from '../useCases/logout/LogoutUseCase'
import { RefreshTokenUseCase } from '../useCases/refreshToken/RefreshTokenUseCase'
import { loginSchema, logoutSchema, refreshTokenSchema } from '../validators/auth.schema'
import { AppError } from '../../../core/errors/AppError'

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) { }

  login = async (req: Request, res: Response) => {
    try {
      const validated = loginSchema.parse(req.body)
      const result = await this.loginUseCase.execute(validated)
      return res.status(200).json(result)
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ status: 'error', message: error.message })
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ status: 'error', message: 'Dados inválidos', errors: error.issues })
      }
      return res.status(500).json({ status: 'error', message: 'Erro interno do servidor' })
    }
  }

  logout = async (req: Request, res: Response) => {
    try {
      const validated = logoutSchema.parse(req.body)
      await this.logoutUseCase.execute(validated.refreshToken)
      return res.status(200).json({ status: 'success', message: 'Logout realizado com sucesso' })
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ status: 'error', message: error.message })
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ status: 'error', message: 'Dados inválidos', errors: error.issues })
      }
      return res.status(500).json({ status: 'error', message: 'Erro interno do servidor' })
    }
  }

  refreshToken = async (req: Request, res: Response) => {
    try {
      const validated = refreshTokenSchema.parse(req.body)
      const result = await this.refreshTokenUseCase.execute(validated.refreshToken)
      return res.status(200).json(result)
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ status: 'error', message: error.message })
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ status: 'error', message: 'Dados inválidos', errors: error.issues })
      }
      return res.status(500).json({ status: 'error', message: 'Erro interno do servidor' })
    }
  }

  checkUrlPermission = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        })
      }

      const url = req.query.url as string

      if (!url) {
        return res.status(400).json({
          error: 'BAD_REQUEST',
          message: 'Parâmetro "url" é obrigatório',
        })
      }

      // Normaliza a URL removendo barras no final
      const normalizedUrl = url.trim().replace(/\/$/, '')

      // Dashboard é sempre acessível
      if (normalizedUrl === '/dashboard') {
        return res.json({ hasPermission: true })
      }

      // Buscar menus do usuário através das permissões
      const userPermissions = req.user.permissions || []
      
      // Importar catálogo de menus
      const { MENU_CATALOG } = await import('../../menus/catalog')
      
      // Filtrar menus que o usuário tem permissão
      const allowedMenus = MENU_CATALOG.filter((menu) =>
        userPermissions.includes(menu.key)
      )

      // Coletar todas as URLs dos menus permitidos
      const allowedUrls = allowedMenus
        .map((menu) => menu.url)
        .filter((url) => url && url.trim() !== '' && url !== '#')
        .map((url) => url.trim().replace(/\/$/, ''))

      // Verifica se a URL atual está na lista de URLs permitidas
      const hasPermission = allowedUrls.some((allowedUrl) => {
        // Match exato
        if (allowedUrl === normalizedUrl) {
          return true
        }

        // Match para rotas dinâmicas (ex: "/clientes" permite "/clientes/123")
        if (normalizedUrl.startsWith(allowedUrl + '/')) {
          return true
        }

        return false
      })

      return res.json({ hasPermission })
    } catch (error) {
      console.error('Erro ao verificar permissão de URL:', error)
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
      })
    }
  }
}

