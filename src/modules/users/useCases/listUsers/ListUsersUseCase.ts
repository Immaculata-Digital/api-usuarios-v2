import { formatFeatureKey } from '../../../features/catalog'
import type { IUserRepository } from '../../repositories/IUserRepository'

export interface ListUsersFilters {
  search?: string | undefined
  groupId?: string | undefined
  feature?: string | undefined
}

export class ListUsersUseCase {
  constructor(private readonly usersRepository: IUserRepository) {}

  async execute(schema: string, filters: ListUsersFilters = {}) {
    const users = await this.usersRepository.findAll(schema)

    const { search, groupId, feature } = filters
    const normalizedSearch = search?.toLowerCase()
    const normalizedFeature =
      typeof feature === 'string' ? formatFeatureKey(feature) : undefined

    return users.filter((user) => {
      const matchesSearch = normalizedSearch
        ? [user.fullName, user.login, user.email].some((value) =>
            value.toLowerCase().includes(normalizedSearch),
          )
        : true

      const matchesGroup = groupId ? user.groupIds.includes(groupId) : true
      const matchesFeature = normalizedFeature
        ? user.allowFeatures.includes(normalizedFeature) &&
          !user.deniedFeatures.includes(normalizedFeature)
        : true

      return matchesSearch && matchesGroup && matchesFeature
    })
  }
}

