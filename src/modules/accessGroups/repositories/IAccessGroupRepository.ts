import type { AccessGroup, AccessGroupProps } from '../entities/AccessGroup'

export interface IAccessGroupRepository {
  findAll(): Promise<AccessGroupProps[]>
  findById(id: string): Promise<AccessGroupProps | null>
  findByCode(code: string): Promise<AccessGroupProps | null>
  findManyByIds(ids: string[]): Promise<AccessGroupProps[]>
  create(group: AccessGroup): Promise<AccessGroupProps>
  update(group: AccessGroup): Promise<AccessGroupProps>
  delete(id: string): Promise<void>
}

