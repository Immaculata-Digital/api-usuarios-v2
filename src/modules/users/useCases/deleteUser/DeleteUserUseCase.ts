import { AppError } from '../../../../core/errors/AppError'
import type { IUserRepository } from '../../repositories/IUserRepository'

export class DeleteUserUseCase {
  constructor(private readonly usersRepository: IUserRepository) {}

  async execute(id: string) {
    const user = await this.usersRepository.findById(id)

    if (!user) {
      throw new AppError('Usuário não encontrado', 404)
    }

    await this.usersRepository.delete(id)
  }
}

