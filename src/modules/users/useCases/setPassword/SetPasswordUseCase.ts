import { AppError } from '../../../../core/errors/AppError'
import { hashPassword } from '../../../../core/utils/passwordCipher'
import { verifyPasswordToken } from '../../../../core/utils/jwt'
import { pool } from '../../../../infra/database/pool'
import type { IUserRepository } from '../../repositories/IUserRepository'
import type { UserProps } from '../../entities/User'

export class SetPasswordUseCase {
  constructor(private readonly usersRepository: IUserRepository) {}

  async execute(token: string, password: string) {
    let payload: { sub: string }
    try {
      payload = verifyPasswordToken(token)
    } catch {
      throw new AppError('Token inválido ou expirado', 401)
    }

    // Buscar schema através do email do usuário (precisamos do email primeiro)
    // Por enquanto, vamos tentar encontrar o usuário em todos os schemas
    // NOTA: Idealmente, o schema deveria estar no token JWT
    const schemasResult = await pool.query<{ schema_name: string }>(
      `SELECT schema_name 
       FROM information_schema.schemata 
       WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
       ORDER BY schema_name`
    )

    let user: UserProps | null = null
    let userSchema: string | null = null

    for (const row of schemasResult.rows) {
      const schema = row.schema_name
      const foundUser = await this.usersRepository.findById(schema, payload.sub)
      if (foundUser) {
        user = foundUser
        userSchema = schema
        break
      }
    }

    if (!user || !userSchema) {
      throw new AppError('Usuário não encontrado', 404)
    }

    const hashed = await hashPassword(password)
    await this.usersRepository.updatePassword(userSchema, user.id, hashed)

    return {
      id: user.id,
      fullName: user.fullName,
      login: user.login,
      email: user.email,
    }
  }
}

