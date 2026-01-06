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
  lojas_gestoras: number[] | null
}

const mapRowToProps = (row: UserRow): UserProps => {
  const props: UserProps = {
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
  }
  
  // Só adiciona lojasGestoras se houver valores
  if (row.lojas_gestoras && row.lojas_gestoras.length > 0) {
    props.lojasGestoras = row.lojas_gestoras
  }
  
  return props
}

const buildSelectQuery = (schema: string, extraCondition = '', includePassword = false) => {
  const schemaPrefix = `"${schema}".`
  return `
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
        ARRAY_AGG(DISTINCT m.group_id) FILTER (WHERE m.group_id IS NOT NULL),
        '{}'
      ) AS group_ids,
      COALESCE(
        ARRAY_AGG(DISTINCT lg.id_loja) FILTER (WHERE lg.id_loja IS NOT NULL),
        '{}'
      ) AS lojas_gestoras
    FROM ${schemaPrefix}users u
    LEFT JOIN ${schemaPrefix}access_group_memberships m ON m.user_id = u.id
    LEFT JOIN ${schemaPrefix}user_lojas_gestoras lg ON lg.user_id = u.id
    ${extraCondition}
    GROUP BY u.id, u.full_name, u.login, u.email${includePassword ? ', u.password' : ''}, u.allow_features, u.denied_features, u.created_by, u.updated_by, u.created_at, u.updated_at
  `
}

export class PostgresUserRepository implements IUserRepository {
  async findAll(schema: string): Promise<UserProps[]> {
    const result = await pool.query<UserRow>(buildSelectQuery(schema))
    return result.rows.map(mapRowToProps)
  }

  async findById(schema: string, id: string): Promise<UserProps | null> {
    const result = await pool.query<UserRow>(buildSelectQuery(schema, 'WHERE u.id = $1'), [id])
    const row = result.rows[0]
    return row ? mapRowToProps(row) : null
  }

  async findByLogin(schema: string, login: string): Promise<UserProps | null> {
    const result = await pool.query<UserRow>(buildSelectQuery(schema, 'WHERE LOWER(u.login) = LOWER($1)'), [
      login,
    ])
    const row = result.rows[0]
    return row ? mapRowToProps(row) : null
  }

  async findByEmail(schema: string, email: string): Promise<UserProps | null> {
    const result = await pool.query<UserRow>(buildSelectQuery(schema, 'WHERE LOWER(u.email) = LOWER($1)'), [
      email,
    ])
    const row = result.rows[0]
    return row ? mapRowToProps(row) : null
  }

  async findByLoginOrEmailWithPassword(schema: string, loginOrEmail: string): Promise<(UserProps & { passwordHash: string | null }) | null> {
    const result = await pool.query<UserRow>(
      buildSelectQuery(schema, 'WHERE LOWER(u.login) = LOWER($1) OR LOWER(u.email) = LOWER($1)', true),
      [loginOrEmail],
    )
    const row = result.rows[0]
    if (!row) return null
    return {
      ...mapRowToProps(row),
      passwordHash: row.password,
    }
  }

  async create(schema: string, user: User, lojasGestoras?: number[]): Promise<UserProps> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const data = user.toJSON()
      const schemaPrefix = `"${schema}".`

      await client.query(
        `
          INSERT INTO ${schemaPrefix}users (
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

      await this.syncMemberships(client, schema, data.id, data.groupIds)
      await this.syncLojasGestoras(client, schema, data.id, lojasGestoras)
      await client.query('COMMIT')

      const inserted = await this.findById(schema, data.id)
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

  async update(schema: string, user: User, lojasGestoras?: number[]): Promise<UserProps> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const data = user.toJSON()
      const schemaPrefix = `"${schema}".`

      await client.query(
        `
          UPDATE ${schemaPrefix}users
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

      await this.syncMemberships(client, schema, data.id, data.groupIds)
      await this.syncLojasGestoras(client, schema, data.id, lojasGestoras)
      await client.query('COMMIT')

      const updated = await this.findById(schema, data.id)
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

  async delete(schema: string, id: string): Promise<void> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const schemaPrefix = `"${schema}".`
      // Deletar memberships e lojas gestoras primeiro (por causa do CASCADE, isso será automático, mas vamos fazer explicitamente)
      await client.query(`DELETE FROM ${schemaPrefix}access_group_memberships WHERE user_id = $1`, [id])
      await client.query(`DELETE FROM ${schemaPrefix}user_lojas_gestoras WHERE user_id = $1`, [id])
      await client.query(`DELETE FROM ${schemaPrefix}users WHERE id = $1`, [id])
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  private async syncMemberships(client: PoolClient, schema: string, userId: string, groupIds: string[]) {
    const schemaPrefix = `"${schema}".`
    await client.query(`DELETE FROM ${schemaPrefix}access_group_memberships WHERE user_id = $1`, [userId])
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
        INSERT INTO ${schemaPrefix}access_group_memberships (user_id, group_id)
        VALUES ${values.join(', ')}
      `,
      params,
    )
  }

  private async syncLojasGestoras(client: PoolClient, schema: string, userId: string, lojasGestoras?: number[]) {
    const schemaPrefix = `"${schema}".`
    await client.query(`DELETE FROM ${schemaPrefix}user_lojas_gestoras WHERE user_id = $1`, [userId])
    if (!lojasGestoras || lojasGestoras.length === 0) {
      return
    }

    const values: string[] = []
    const params: unknown[] = [userId]
    lojasGestoras.forEach((idLoja, index) => {
      values.push(`($1, $${index + 2})`)
      params.push(idLoja)
    })

    await client.query(
      `
        INSERT INTO ${schemaPrefix}user_lojas_gestoras (user_id, id_loja)
        VALUES ${values.join(', ')}
      `,
      params,
    )
  }

  async updatePassword(schema: string, id: string, password: string | null): Promise<void> {
    const schemaPrefix = `"${schema}".`
    await pool.query(
      `
        UPDATE ${schemaPrefix}users
        SET password = $2,
            updated_at = NOW()
        WHERE id = $1
      `,
      [id, password],
    )
  }

  async findSchemaByEmail(email: string): Promise<string | null> {
    const client = await pool.connect()
    try {
      // Buscar em todos os schemas (exceto system schemas)
      const schemasResult = await client.query<{ schema_name: string }>(
        `SELECT schema_name 
         FROM information_schema.schemata 
         WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
         ORDER BY schema_name`
      )

      for (const row of schemasResult.rows) {
        const schema = row.schema_name
        const userResult = await client.query<{ id: string }>(
          `SELECT id FROM "${schema}".users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          [email]
        )
        if (userResult.rows.length > 0) {
          return schema
        }
      }

      return null
    } finally {
      client.release()
    }
  }

  async findSchemaByLoginOrEmail(loginOrEmail: string): Promise<{ schema: string; user: UserProps & { passwordHash: string | null } } | null> {
    const client = await pool.connect()
    try {
      // Buscar em todos os schemas (exceto system schemas)
      const schemasResult = await client.query<{ schema_name: string }>(
        `SELECT schema_name 
         FROM information_schema.schemata 
         WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
         ORDER BY schema_name`
      )

      for (const row of schemasResult.rows) {
        const schema = row.schema_name
        const result = await client.query<UserRow>(
          buildSelectQuery(schema, 'WHERE LOWER(u.login) = LOWER($1) OR LOWER(u.email) = LOWER($1)', true),
          [loginOrEmail],
        )
        const userRow = result.rows[0]
        if (userRow) {
          return {
            schema,
            user: {
              ...mapRowToProps(userRow),
              passwordHash: userRow.password,
            },
          }
        }
      }

      return null
    } finally {
      client.release()
    }
  }
}

