import { AppError } from '../../../../core/errors/AppError'
import type { UpdateUserPermissionsDTO } from '../../dto/UpdateUserPermissionsDTO'
import { User } from '../../entities/User'
import type { IUserRepository } from '../../repositories/IUserRepository'

export class UpdateUserPermissionsUseCase {
  constructor(private readonly usersRepository: IUserRepository) {}

  async execute(schema: string, id: string, payload: UpdateUserPermissionsDTO) {
    const existing = await this.usersRepository.findById(schema, id)

    if (!existing) {
      throw new AppError('Usuário não encontrado', 404)
    }

    const user = User.restore(existing)
    user.update({
      allowFeatures: payload.allowFeatures,
      deniedFeatures: payload.deniedFeatures,
      updatedBy: payload.updatedBy,
    })

    return this.usersRepository.update(schema, user)
  }
}

