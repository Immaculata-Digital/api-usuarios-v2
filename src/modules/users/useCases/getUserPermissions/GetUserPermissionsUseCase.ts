import { AppError } from '../../../../core/errors/AppError'
import type { IAccessGroupRepository } from '../../../accessGroups/repositories/IAccessGroupRepository'
import type { IUserRepository } from '../../repositories/IUserRepository'

export class GetUserPermissionsUseCase {
    constructor(
        private readonly usersRepository: IUserRepository,
        private readonly accessGroupsRepository: IAccessGroupRepository,
    ) { }

    async execute(schema: string, userId: string): Promise<string[]> {
        const user = await this.usersRepository.findById(schema, userId)

        if (!user) {
            throw new AppError('Usuário não encontrado', 404)
        }

        const groups = await this.accessGroupsRepository.findManyByIds(user.groupIds)

        const permissions = new Set<string>()

        // 1. Add permissions from groups
        groups.forEach((group) => {
            group.features.forEach((feature) => permissions.add(feature))
        })

        // 2. Add allowed particular features
        user.allowFeatures.forEach((feature) => permissions.add(feature))

        // 3. Remove denied particular features
        user.deniedFeatures.forEach((feature) => permissions.delete(feature))

        return Array.from(permissions)
    }
}

