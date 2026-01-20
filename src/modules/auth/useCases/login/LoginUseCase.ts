import { AppError } from '../../../../core/errors/AppError'
import { comparePassword } from '../../../../core/utils/passwordCipher'
import { generateAccessToken, generateRefreshToken } from '../../../../core/utils/jwt'
import type { IUserRepository } from '../../../users/repositories/IUserRepository'
import { PermissionService } from '../../services/PermissionService'

export interface LoginDTO {
  loginOrEmail: string
  password: string
  schema?: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    fullName: string
    login: string
    email: string
    id_loja?: number
  }
}

export class LoginUseCase {
  constructor(
    private readonly usersRepository: IUserRepository,
    private readonly permissionService: PermissionService,
  ) {}

  async execute(data: LoginDTO): Promise<LoginResponse> {
    try {
      console.log('[LOGIN_USE_CASE] Iniciando execução do use case')
      console.log('[LOGIN_USE_CASE] Dados recebidos:', {
        loginOrEmail: data.loginOrEmail,
        passwordPresent: !!data.password,
        passwordLength: data.password?.length || 0
      })

      // 1. Buscar usuário por login ou email (com senha) no schema especificado
      if (!data.schema) {
        console.log('[LOGIN_USE_CASE] Schema não fornecido')
        throw new AppError('Schema é obrigatório para login', 400)
      }

      console.log('[LOGIN_USE_CASE] Buscando usuário no schema:', data.schema)
      const userWithPassword = await this.usersRepository.findByLoginOrEmailWithPassword(data.schema, data.loginOrEmail)

      if (!userWithPassword) {
        console.log('[LOGIN_USE_CASE] Usuário não encontrado para:', data.loginOrEmail, 'no schema:', data.schema)
        throw new AppError('Credenciais inválidas', 401)
      }

      console.log('[LOGIN_USE_CASE] Usuário encontrado:', {
        id: userWithPassword.id,
        login: userWithPassword.login,
        email: userWithPassword.email,
        hasPasswordHash: !!userWithPassword.passwordHash
      })

      // 2. Verificar se o usuário tem senha definida
      if (!userWithPassword.passwordHash) {
        console.log('[LOGIN_USE_CASE] Usuário sem senha definida:', userWithPassword.id)
        throw new AppError('Senha não definida. Verifique seu e-mail para definir sua senha.', 401)
      }

      // 3. Validar senha (a função comparePassword agora suporta múltiplos formatos)
      console.log('[LOGIN_USE_CASE] Validando senha...')
      const isPasswordValid = await comparePassword(data.password, userWithPassword.passwordHash)

      if (!isPasswordValid) {
        console.log('[LOGIN_USE_CASE] Senha inválida para usuário:', userWithPassword.id)
        throw new AppError('Credenciais inválidas', 401)
      }

      console.log('[LOGIN_USE_CASE] Senha válida. Calculando permissões...')
      // 4. Calcular permissões do usuário
      const permissions = await this.permissionService.calculateUserPermissions(userWithPassword)
      console.log('[LOGIN_USE_CASE] Permissões calculadas:', {
        count: permissions.length,
        permissions: permissions.slice(0, 10) // Mostra apenas as primeiras 10 para não poluir o log
      })

      console.log('[LOGIN_USE_CASE] Gerando tokens...')
      // 6. Gerar tokens
      const accessToken = generateAccessToken({
        userId: userWithPassword.id,
        login: userWithPassword.login,
        email: userWithPassword.email,
        permissions,
      })

      const refreshToken = generateRefreshToken(userWithPassword.id)
      console.log('[LOGIN_USE_CASE] Tokens gerados com sucesso')

      // Obter a primeira loja gestora do usuário (se houver)
      const id_loja = userWithPassword.lojasGestoras && userWithPassword.lojasGestoras.length > 0
        ? userWithPassword.lojasGestoras[0]
        : undefined

      console.log('[LOGIN_USE_CASE] id_loja obtido:', id_loja)

      return {
        accessToken,
        refreshToken,
        user: {
          id: userWithPassword.id,
          fullName: userWithPassword.fullName,
          login: userWithPassword.login,
          email: userWithPassword.email,
          id_loja,
        },
      }
    } catch (error: unknown) {
      const err = error as any
      console.error('[LOGIN_USE_CASE] Erro durante execução do use case:')
      console.error('[LOGIN_USE_CASE] Tipo:', err?.constructor?.name)
      console.error('[LOGIN_USE_CASE] Mensagem:', err?.message)
      console.error('[LOGIN_USE_CASE] Stack:', err?.stack)
      throw error
    }
  }
}

