import { AppError } from '../../../../core/errors/AppError'
import { formatGroupCode } from '../../../../core/utils/formatGroupCode'
import type { UpdateAccessGroupDTO } from '../../dto/UpdateAccessGroupDTO'
import { AccessGroup } from '../../entities/AccessGroup'
import type { IAccessGroupRepository } from '../../repositories/IAccessGroupRepository'

export class UpdateAccessGroupUseCase {
  constructor(private readonly repository: IAccessGroupRepository) { }

  async execute(id: string, payload: UpdateAccessGroupDTO) {
    const existing = await this.repository.findById(id)

    if (!existing) {
      throw new AppError('Grupo não encontrado', 404)
    }

    if (payload.code) {
      const normalizedCode = formatGroupCode(payload.code)
      if (normalizedCode !== existing.code) {
        const codeTaken = await this.repository.findByCode(normalizedCode)
        if (codeTaken) {
          throw new AppError('Código do grupo já está em uso', 409)
        }
      }
      payload.code = normalizedCode
    }

    const group = AccessGroup.restore(existing)
    group.update(payload)

    return this.repository.update(group)
  }
}

