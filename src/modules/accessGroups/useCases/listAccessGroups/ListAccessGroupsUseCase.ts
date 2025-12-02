import { formatFeatureKey } from '../../../features/catalog'
import type { IAccessGroupRepository } from '../../repositories/IAccessGroupRepository'

export interface ListAccessGroupsFilters {
  search?: string | undefined
  feature?: string | undefined
}

export class ListAccessGroupsUseCase {
  constructor(private readonly repository: IAccessGroupRepository) { }

  async execute(filters: ListAccessGroupsFilters = {}) {
    const groups = await this.repository.findAll()
    const { search, feature } = filters
    const normalizedSearch = search?.toLowerCase()
    const normalizedFeature =
      typeof feature === 'string' ? formatFeatureKey(feature) : undefined

    return groups.filter((group) => {
      const matchesSearch = normalizedSearch
        ? [group.name, group.code].some((value) => value.toLowerCase().includes(normalizedSearch))
        : true

      const matchesFeature = normalizedFeature ? group.features.includes(normalizedFeature) : true

      return matchesSearch && matchesFeature
    })
  }
}

