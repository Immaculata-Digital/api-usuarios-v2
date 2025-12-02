import { AppError } from '../../../../core/errors/AppError'
import { comparePassword } from '../../../../core/utils/passwordCipher'
import { generateAccessToken, generateRefreshToken } from '../../../../core/utils/jwt'
import type { IUserRepository } from '../../../users/repositories/IUserRepository'
import { PermissionService } from '../../services/PermissionService'

export interface LoginDTO {
  loginOrEmail: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    fullName: string
    login: string
    email: string
  }
}

export class LoginUseCase {
  constructor(
    private readonly usersRepository: IUserRepository,
    private readonly permissionService: PermissionService,
  ) {}

  async execute(data: LoginDTO): Promise<LoginResponse> {
    // 1. Buscar usuário por login ou email (com senha)
    const userWithPassword = await this.usersRepository.findByLoginOrEmailWithPassword(
      data.loginOrEmail,
    )

    if (!userWithPassword) {
      throw new AppError('Credenciais inválidas', 401)
    }

    // 2. Verificar se o usuário tem senha definida
    if (!userWithPassword.passwordHash) {
      throw new AppError('Senha não definida. Verifique seu e-mail para definir sua senha.', 401)
    }

    // 3. Validar senha (a função comparePassword agora suporta múltiplos formatos)
    const isPasswordValid = await comparePassword(data.password, userWithPassword.passwordHash)

    if (!isPasswordValid) {
      throw new AppError('Credenciais inválidas', 401)
    }

    // 4. Calcular permissões do usuário
    const permissions = await this.permissionService.calculateUserPermissions(userWithPassword)

    // 6. Gerar tokens
    const accessToken = generateAccessToken({
      userId: userWithPassword.id,
      login: userWithPassword.login,
      email: userWithPassword.email,
      permissions,
    })

    const refreshToken = generateRefreshToken(userWithPassword.id)

    return {
      accessToken,
      refreshToken,
      user: {
        id: userWithPassword.id,
        fullName: userWithPassword.fullName,
        login: userWithPassword.login,
        email: userWithPassword.email,
      },
    }
  }
}

