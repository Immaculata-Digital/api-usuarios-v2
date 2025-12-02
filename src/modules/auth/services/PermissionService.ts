import type { UserProps } from '../../users/entities/User'
import type { AccessGroupProps } from '../../accessGroups/entities/AccessGroup'
import type { IAccessGroupRepository } from '../../accessGroups/repositories/IAccessGroupRepository'

export class PermissionService {
  constructor(private readonly accessGroupsRepository: IAccessGroupRepository) { }

  /**
   * Calcula as permissões finais do usuário baseado em:
   * 1. Funcionalidades dos grupos do usuário
   * 2. allow_features do usuário (adiciona permissões)
   * 3. denied_features do usuário (remove permissões)
   */
  async calculateUserPermissions(user: UserProps): Promise<string[]> {
    // 1. Coletar funcionalidades dos grupos
    const groupFeatures = new Set<string>()
    if (user.groupIds.length > 0) {
      const groups = await this.accessGroupsRepository.findManyByIds(user.groupIds)
      groups.forEach((group) => {
        group.features.forEach((feature) => groupFeatures.add(feature))
      })
    }

    // 2. Adicionar allow_features
    user.allowFeatures.forEach((feature) => groupFeatures.add(feature))

    // 3. Remover denied_features
    user.deniedFeatures.forEach((feature) => groupFeatures.delete(feature))

    return Array.from(groupFeatures).sort()
  }
}

