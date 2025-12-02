import type { QueryResult } from 'pg'
import { pool } from '../../../infra/database/pool'
import type { AccessGroup, AccessGroupProps } from '../entities/AccessGroup'
import { AccessGroup as AccessGroupEntity } from '../entities/AccessGroup'
import type { IAccessGroupRepository } from './IAccessGroupRepository'

type AccessGroupRow = {
  id: string
  name: string
  code: string
  features: string[] | null
  created_by: string
  updated_by: string
  created_at: Date
  updated_at: Date
}

const mapRowToEntity = (row: AccessGroupRow): AccessGroupProps => {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    features: row.features ?? [],
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class PostgresAccessGroupRepository implements IAccessGroupRepository {
  async findAll(): Promise<AccessGroupProps[]> {
    const result = await pool.query<AccessGroupRow>(
      `
        SELECT id, name, code, features, created_by, updated_by, created_at, updated_at
        FROM access_groups
        ORDER BY created_at ASC
      `,
    )

    return result.rows.map((row) => mapRowToEntity(row))
  }

  async findById(id: string): Promise<AccessGroupProps | null> {
    const result = await pool.query<AccessGroupRow>(
      `
        SELECT id, name, code, features, created_by, updated_by, created_at, updated_at
        FROM access_groups
        WHERE id = $1
        LIMIT 1
      `,
      [id],
    )

    const row = result.rows[0]
    return row ? mapRowToEntity(row) : null
  }

  async findByCode(code: string): Promise<AccessGroupProps | null> {
    const result = await pool.query<AccessGroupRow>(
      `
        SELECT id, name, code, features, created_by, updated_by, created_at, updated_at
        FROM access_groups
        WHERE code = $1
        LIMIT 1
      `,
      [code],
    )

    const row = result.rows[0]
    return row ? mapRowToEntity(row) : null
  }

  async findManyByIds(ids: string[]): Promise<AccessGroupProps[]> {
    if (ids.length === 0) {
      return []
    }

    const result = await pool.query<AccessGroupRow>(
      `
        SELECT id, name, code, features, created_by, updated_by, created_at, updated_at
        FROM access_groups
        WHERE id = ANY($1::uuid[])
      `,
      [ids],
    )

    return result.rows.map((row) => mapRowToEntity(row))
  }

  async create(group: AccessGroup): Promise<AccessGroupProps> {
    const data = group.toJSON()

    const result = await pool.query<AccessGroupRow>(
      `
        INSERT INTO access_groups (id, name, code, features, created_by, updated_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name, code, features, created_by, updated_by, created_at, updated_at
      `,
      [
        data.id,
        data.name,
        data.code,
        data.features,
        data.createdBy,
        data.updatedBy,
        data.createdAt,
        data.updatedAt,
      ],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('Falha ao inserir grupo de acesso')
    }
    return mapRowToEntity(row)
  }

  async update(group: AccessGroup): Promise<AccessGroupProps> {
    const data = group.toJSON()

    const result = await pool.query<AccessGroupRow>(
      `
        UPDATE access_groups
        SET
          name = $2,
          code = $3,
          features = $4,
          updated_by = $5,
          updated_at = $6
        WHERE id = $1
        RETURNING id, name, code, features, created_by, updated_by, created_at, updated_at
      `,
      [data.id, data.name, data.code, data.features, data.updatedBy, data.updatedAt],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('Falha ao atualizar grupo de acesso')
    }
    return mapRowToEntity(row)
  }

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM access_groups WHERE id = $1', [id])
  }
}

