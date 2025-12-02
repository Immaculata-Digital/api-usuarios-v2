import type { User, UserProps } from '../entities/User'

export interface IUserRepository {
  findAll(): Promise<UserProps[]>
  findById(id: string): Promise<UserProps | null>
  findByLogin(login: string): Promise<UserProps | null>
  findByEmail(email: string): Promise<UserProps | null>
  findByLoginOrEmailWithPassword(loginOrEmail: string): Promise<(UserProps & { passwordHash: string | null }) | null>
  create(user: User): Promise<UserProps>
  update(user: User): Promise<UserProps>
  delete(id: string): Promise<void>
  updatePassword(id: string, password: string | null): Promise<void>
}

