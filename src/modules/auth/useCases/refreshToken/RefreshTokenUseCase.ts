import { AppError } from '../../../../core/errors/AppError'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../../../core/utils/jwt'
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

    async execute(refreshToken: string): Promise<RefreshTokenResponse> {
        try {
            // 1. Verificar o refresh token
            const payload = verifyRefreshToken(refreshToken)
            const userId = payload.userId

            // 2. Buscar usuário
            const user = await this.usersRepository.findById(userId)
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

