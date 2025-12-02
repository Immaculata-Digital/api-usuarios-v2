import { AppError } from '../../../../core/errors/AppError'
import type { IAccessGroupRepository } from '../../repositories/IAccessGroupRepository'

export class DeleteAccessGroupUseCase {
  constructor(private readonly repository: IAccessGroupRepository) { }

  async execute(id: string) {
    const existing = await this.repository.findById(id)

    if (!existing) {
      throw new AppError('Grupo não encontrado', 404)
    }

    await this.repository.delete(id)
  }
}

