import { AppError } from '../../../../core/errors/AppError'
import { hashPassword } from '../../../../core/utils/passwordCipher'
import { verifyPasswordToken } from '../../../../core/utils/jwt'
import type { IUserRepository } from '../../repositories/IUserRepository'

export class SetPasswordUseCase {
  constructor(private readonly usersRepository: IUserRepository) {}

  async execute(token: string, password: string) {
    let payload: { sub: string }
    try {
      payload = verifyPasswordToken(token)
    } catch {
      throw new AppError('Token inválido ou expirado', 401)
    }

    const user = await this.usersRepository.findById(payload.sub)
    if (!user) {
      throw new AppError('Usuário não encontrado', 404)
    }

    const hashed = await hashPassword(password)
    await this.usersRepository.updatePassword(user.id, hashed)

    return {
      id: user.id,
      fullName: user.fullName,
      login: user.login,
      email: user.email,
    }
  }
}

