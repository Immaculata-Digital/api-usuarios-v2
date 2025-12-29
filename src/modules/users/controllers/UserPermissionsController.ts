import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../../../core/errors/AppError'
import { accessGroupRepository } from '../../accessGroups/repositories'
import { userRepository } from '../repositories'
import { GetUserPermissionsUseCase } from '../useCases/getUserPermissions/GetUserPermissionsUseCase'

export class UserPermissionsController {
    constructor(private readonly getUserPermissions: GetUserPermissionsUseCase) { }

    show = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const schema = req.schema!
            const { id } = req.params

            if (!id) {
                throw new AppError('Parâmetro id é obrigatório', 400)
            }

            const permissions = await this.getUserPermissions.execute(schema, id)
            return res.json(permissions)
        } catch (error) {
            return next(error)
        }
    }

    myPermissions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw new AppError('Usuário não autenticado', 401)
            }

            // Para myPermissions, o schema pode vir do header ou tentar buscar pelo usuário
            const schema = req.schema || req.headers['x-schema'] as string
            if (!schema) {
                throw new AppError('Schema é obrigatório', 400)
            }

            const userId = req.user.userId
            const permissions = await this.getUserPermissions.execute(schema, userId)

            const user = await userRepository.findById(schema, userId)
            if (!user) {
                throw new AppError('Usuário não encontrado', 404)
            }

            return res.json({
                usuario: {
                    id: user.id,
                    login: user.login,
                    email: user.email,
                    fullName: user.fullName,
                },
                funcionalidades: permissions,
                total: permissions.length,
            })
        } catch (error) {
            return next(error)
        }
    }
}

export const userPermissionsController = new UserPermissionsController(
    new GetUserPermissionsUseCase(userRepository, accessGroupRepository),
)

