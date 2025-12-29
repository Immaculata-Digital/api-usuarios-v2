import { AppError } from '../../../../core/errors/AppError'
import type { UpdateUserDTO } from '../../dto/UpdateUserDTO'
import { User } from '../../entities/User'
import type { IUserRepository } from '../../repositories/IUserRepository'
import type { IAccessGroupRepository } from '../../../accessGroups/repositories/IAccessGroupRepository'

export class UpdateUserUseCase {
  constructor(
    private readonly usersRepository: IUserRepository,
    private readonly accessGroupsRepository: IAccessGroupRepository,
  ) { }

  async execute(schema: string, id: string, payload: UpdateUserDTO) {
    const existing = await this.usersRepository.findById(schema, id)

    if (!existing) {
      throw new AppError('Usuário não encontrado', 404)
    }

    if (payload.login && payload.login !== existing.login) {
      const loginTaken = await this.usersRepository.findByLogin(schema, payload.login)
      if (loginTaken) {
        throw new AppError('Login já está em uso', 409)
      }
    }

    if (payload.email && payload.email !== existing.email) {
      const emailTaken = await this.usersRepository.findByEmail(schema, payload.email)
      if (emailTaken) {
        throw new AppError('E-mail já está em uso', 409)
      }
    }

    if (payload.groupIds) {
      const groups = await this.accessGroupsRepository.findManyByIds(payload.groupIds)
      if (groups.length !== new Set(payload.groupIds).size) {
        throw new AppError('Um ou mais grupos não foram encontrados', 404)
      }
    }

    const user = User.restore(existing)
    user.update(payload)

    return this.usersRepository.update(schema, user)
  }
}

