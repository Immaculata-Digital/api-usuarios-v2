import { AppError } from '../../../../core/errors/AppError'
import type { IAccessGroupRepository } from '../../repositories/IAccessGroupRepository'

export class GetAccessGroupUseCase {
  constructor(private readonly repository: IAccessGroupRepository) { }

  async execute(id: string) {
    const group = await this.repository.findById(id)

    if (!group) {
      throw new AppError('Grupo não encontrado', 404)
    }

    return group
  }
}

