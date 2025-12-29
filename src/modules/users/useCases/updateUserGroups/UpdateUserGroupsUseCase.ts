import { AppError } from '../../../../core/errors/AppError'
import type { UpdateUserGroupsDTO } from '../../dto/UpdateUserGroupsDTO'
import { User } from '../../entities/User'
import type { IUserRepository } from '../../repositories/IUserRepository'
import type { IAccessGroupRepository } from '../../../accessGroups/repositories/IAccessGroupRepository'

export class UpdateUserGroupsUseCase {
  constructor(
    private readonly usersRepository: IUserRepository,
    private readonly accessGroupsRepository: IAccessGroupRepository,
  ) {}

  async execute(schema: string, id: string, payload: UpdateUserGroupsDTO) {
    const existing = await this.usersRepository.findById(schema, id)

    if (!existing) {
      throw new AppError('Usuário não encontrado', 404)
    }

    const groups = await this.accessGroupsRepository.findManyByIds(payload.groupIds)
    if (groups.length !== new Set(payload.groupIds).size) {
      throw new AppError('Um ou mais grupos não foram encontrados', 404)
    }

    const user = User.restore(existing)
    user.update({
      groupIds: payload.groupIds,
      updatedBy: payload.updatedBy,
    })

    return this.usersRepository.update(schema, user)
  }
}

