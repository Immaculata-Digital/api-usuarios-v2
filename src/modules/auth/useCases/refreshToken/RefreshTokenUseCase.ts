import { AppError } from '../../../../core/errors/AppError'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../../../core/utils/jwt'
import { pool } from '../../../../infra/database/pool'
import type { IUserRepository } from '../../../users/repositories/IUserRepository'
import { PermissionService } from '../../services/PermissionService'

interface RefreshTokenResponse {
    accessToken: string
    refreshToken: string
}

export class RefreshTokenUseCase {
    constructor(
        private readonly usersRepository: IUserRepository,
        private readonly permissionService: PermissionService,
    ) { }

    async execute(refreshToken: string, schema?: string): Promise<RefreshTokenResponse> {
        try {
            // 1. Verificar o refresh token
            const payload = verifyRefreshToken(refreshToken)
            const userId = payload.userId

            // 2. Buscar schema se não fornecido
            let userSchema = schema
            if (!userSchema) {
                // Se não tiver schema, tenta buscar em todos os schemas
                // Primeiro busca o usuário para obter o email
                const client = await pool.connect()
                try {
                    const schemasResult = await client.query<{ schema_name: string }>(
                        `SELECT schema_name 
                         FROM information_schema.schemata 
                         WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
                         ORDER BY schema_name`
                    )
                    for (const row of schemasResult.rows) {
                        const testSchema = row.schema_name
                        const userResult = await client.query<{ id: string }>(
                            `SELECT id FROM "${testSchema}".users WHERE id = $1 LIMIT 1`,
                            [userId]
                        )
                        if (userResult.rows.length > 0) {
                            userSchema = testSchema
                            break
                        }
                    }
                } finally {
                    client.release()
                }
                if (!userSchema) {
                    throw new AppError('Usuário não encontrado', 401)
                }
            }

            // 3. Buscar usuário
            const user = await this.usersRepository.findById(userSchema, userId)
            if (!user) {
                throw new AppError('Usuário não encontrado', 401)
            }

            // 3. Recalcular permissões
            const permissions = await this.permissionService.calculateUserPermissions(user)

            // 4. Gerar novos tokens
            const newAccessToken = generateAccessToken({
                userId: user.id,
                login: user.login,
                email: user.email,
                permissions,
            })

            const newRefreshToken = generateRefreshToken(user.id)

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            }
        } catch (error) {
            throw new AppError('Refresh token inválido ou expirado', 401)
        }
    }
}

