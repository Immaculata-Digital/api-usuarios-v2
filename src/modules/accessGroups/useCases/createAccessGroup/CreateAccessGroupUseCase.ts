import { AppError } from '../../../../core/errors/AppError'
import { formatGroupCode } from '../../../../core/utils/formatGroupCode'
import type { CreateAccessGroupDTO } from '../../dto/CreateAccessGroupDTO'
import { AccessGroup } from '../../entities/AccessGroup'
import type { IAccessGroupRepository } from '../../repositories/IAccessGroupRepository'

export class CreateAccessGroupUseCase {
  constructor(private readonly repository: IAccessGroupRepository) { }

  async execute(payload: CreateAccessGroupDTO) {
    const normalizedCode = formatGroupCode(payload.code)
    const codeTaken = await this.repository.findByCode(normalizedCode)

    if (codeTaken) {
      throw new AppError('Código do grupo já está em uso', 409)
    }

    const group = AccessGroup.create({
      ...payload,
      code: normalizedCode,
      features: payload.features ?? [],
      updatedBy: payload.createdBy,
    })

    return this.repository.create(group)
  }
}

