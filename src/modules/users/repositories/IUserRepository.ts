import type { User, UserProps } from '../entities/User'

export interface IUserRepository {
  findAll(schema: string): Promise<UserProps[]>
  findById(schema: string, id: string): Promise<UserProps | null>
  findByLogin(schema: string, login: string): Promise<UserProps | null>
  findByEmail(schema: string, email: string): Promise<UserProps | null>
  findByLoginOrEmailWithPassword(schema: string, loginOrEmail: string): Promise<(UserProps & { passwordHash: string | null }) | null>
  findSchemaByEmail(email: string): Promise<string | null>
  findSchemaByLoginOrEmail(loginOrEmail: string): Promise<{ schema: string; user: UserProps & { passwordHash: string | null } } | null>
  create(schema: string, user: User, lojasGestoras?: number[]): Promise<UserProps>
  update(schema: string, user: User, lojasGestoras?: number[]): Promise<UserProps>
  delete(schema: string, id: string): Promise<void>
  updatePassword(schema: string, id: string, password: string | null): Promise<void>
}

