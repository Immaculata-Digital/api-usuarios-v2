import type { PoolClient } from 'pg'
import { pool } from '../../../infra/database/pool'
import type { User, UserProps } from '../entities/User'
import { User as UserEntity } from '../entities/User'
import type { IUserRepository } from './IUserRepository'

type UserRow = {
  id: string
  full_name: string
  login: string
  email: string
  password: string | null
  allow_features: string[] | null
  denied_features: string[] | null
  created_by: string
  updated_by: string
  created_at: Date
  updated_at: Date
  group_ids: string[] | null
}

const mapRowToProps = (row: UserRow): UserProps => ({
  id: row.id,
  fullName: row.full_name,
  login: row.login,
  email: row.email,
  groupIds: row.group_ids ?? [],
  allowFeatures: row.allow_features ?? [],
  deniedFeatures: row.denied_features ?? [],
  createdBy: row.created_by,
  updatedBy: row.updated_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const buildSelectQuery = (extraCondition = '', includePassword = false) => `
  SELECT
    u.id,
    u.full_name,
    u.login,
    u.email,
    ${includePassword ? 'u.password,' : ''}
    u.allow_features,
    u.denied_features,
    u.created_by,
    u.updated_by,
    u.created_at,
    u.updated_at,
    COALESCE(
      ARRAY_AGG(m.group_id) FILTER (WHERE m.group_id IS NOT NULL),
      '{}'
    ) AS group_ids
  FROM users u
  LEFT JOIN access_group_memberships m ON m.user_id = u.id
  ${extraCondition}
  GROUP BY u.id, u.full_name, u.login, u.email${includePassword ? ', u.password' : ''}, u.allow_features, u.denied_features, u.created_by, u.updated_by, u.created_at, u.updated_at
`

export class PostgresUserRepository implements IUserRepository {
  async findAll(): Promise<UserProps[]> {
    const result = await pool.query<UserRow>(buildSelectQuery())
    return result.rows.map(mapRowToProps)
  }

  async findById(id: string): Promise<UserProps | null> {
    const result = await pool.query<UserRow>(buildSelectQuery('WHERE u.id = $1'), [id])
    const row = result.rows[0]
    return row ? mapRowToProps(row) : null
  }

  async findByLogin(login: string): Promise<UserProps | null> {
    const result = await pool.query<UserRow>(buildSelectQuery('WHERE LOWER(u.login) = LOWER($1)'), [
      login,
    ])
    const row = result.rows[0]
    return row ? mapRowToProps(row) : null
  }

  async findByEmail(email: string): Promise<UserProps | null> {
    const result = await pool.query<UserRow>(buildSelectQuery('WHERE LOWER(u.email) = LOWER($1)'), [
      email,
    ])
    const row = result.rows[0]
    return row ? mapRowToProps(row) : null
  }

  async findByLoginOrEmailWithPassword(loginOrEmail: string): Promise<(UserProps & { passwordHash: string | null }) | null> {
    const result = await pool.query<UserRow>(
      buildSelectQuery('WHERE LOWER(u.login) = LOWER($1) OR LOWER(u.email) = LOWER($1)', true),
      [loginOrEmail],
    )
    const row = result.rows[0]
    if (!row) return null
    return {
      ...mapRowToProps(row),
      passwordHash: row.password,
    }
  }

  async create(user: User): Promise<UserProps> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const data = user.toJSON()

      await client.query(
        `
          INSERT INTO users (
            id,
            full_name,
            login,
            email,
            allow_features,
            denied_features,
            created_by,
            updated_by,
            created_at,
            updated_at,
            password
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        `,
        [
          data.id,
          data.fullName,
          data.login,
          data.email,
          data.allowFeatures,
          data.deniedFeatures,
          data.createdBy,
          data.updatedBy,
          data.createdAt,
          data.updatedAt,
          null,
        ],
      )

      await this.syncMemberships(client, data.id, data.groupIds)
      await client.query('COMMIT')

      const inserted = await this.findById(data.id)
      if (!inserted) {
        throw new Error('Falha ao recuperar usuário inserido')
      }
      return inserted
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async update(user: User): Promise<UserProps> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const data = user.toJSON()

      await client.query(
        `
          UPDATE users
          SET
            full_name = $2,
            login = $3,
            email = $4,
            allow_features = $5,
            denied_features = $6,
            updated_by = $7,
            updated_at = $8
          WHERE id = $1
        `,
        [
          data.id,
          data.fullName,
          data.login,
          data.email,
          data.allowFeatures,
          data.deniedFeatures,
          data.updatedBy,
          data.updatedAt,
        ],
      )

      await this.syncMemberships(client, data.id, data.groupIds)
      await client.query('COMMIT')

      const updated = await this.findById(data.id)
      if (!updated) {
        throw new Error('Falha ao recuperar usuário atualizado')
      }
      return updated
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async delete(id: string): Promise<void> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('DELETE FROM access_group_memberships WHERE user_id = $1', [id])
      await client.query('DELETE FROM users WHERE id = $1', [id])
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  private async syncMemberships(client: PoolClient, userId: string, groupIds: string[]) {
    await client.query('DELETE FROM access_group_memberships WHERE user_id = $1', [userId])
    if (groupIds.length === 0) {
      return
    }

    const values: string[] = []
    const params: unknown[] = [userId]
    groupIds.forEach((groupId, index) => {
      values.push(`($1, $${index + 2})`)
      params.push(groupId)
    })

    await client.query(
      `
        INSERT INTO access_group_memberships (user_id, group_id)
        VALUES ${values.join(', ')}
      `,
      params,
    )
  }

  async updatePassword(id: string, password: string | null): Promise<void> {
    await pool.query(
      `
        UPDATE users
        SET password = $2,
            updated_at = NOW()
        WHERE id = $1
      `,
      [id, password],
    )
  }
}

