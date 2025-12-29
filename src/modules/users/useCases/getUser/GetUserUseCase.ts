import { AppError } from '../../../../core/errors/AppError'
import type { IUserRepository } from '../../repositories/IUserRepository'

export class GetUserUseCase {
  constructor(private readonly usersRepository: IUserRepository) {}

  async execute(schema: string, id: string) {
    const user = await this.usersRepository.findById(schema, id)

    if (!user) {
      throw new AppError('Usuário não encontrado', 404)
    }

    return user
  }
}

