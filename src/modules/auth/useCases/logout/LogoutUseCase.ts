import { AppError } from '../../../../core/errors/AppError'
import { verifyRefreshToken } from '../../../../core/utils/jwt'

/**
 * Use case para logout
 * Por enquanto, apenas valida o refresh token.
 * Em uma implementação completa, você poderia:
 * - Armazenar refresh tokens inválidos em um blacklist (Redis, banco de dados)
 * - Invalidar o token atual
 */
export class LogoutUseCase {
  async execute(refreshToken: string): Promise<void> {
    try {
      // Verificar se o token é válido
      verifyRefreshToken(refreshToken)

      // Em uma implementação completa, você invalidaria o token aqui
      // Por exemplo, adicionando a um blacklist no Redis ou banco de dados
      // await this.tokenBlacklist.add(refreshToken)

      // Por enquanto, apenas retorna sucesso se o token for válido
    } catch (error) {
      throw new AppError('Token inválido', 401)
    }
  }
}

