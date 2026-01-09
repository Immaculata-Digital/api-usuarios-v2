import { AppError } from '../../../../core/errors/AppError'
import type { CreateUserDTO } from '../../dto/CreateUserDTO'
import { User } from '../../entities/User'
import type { IUserRepository } from '../../repositories/IUserRepository'
import type { IAccessGroupRepository } from '../../../accessGroups/repositories/IAccessGroupRepository'
import { PasswordSetupService } from '../../services/PasswordSetupService'
import { hashPassword } from '../../../../core/utils/passwordCipher'

export class CreateUserUseCase {
  constructor(
    private readonly usersRepository: IUserRepository,
    private readonly accessGroupsRepository: IAccessGroupRepository,
    private readonly passwordSetup: PasswordSetupService,
  ) { }

  async execute(schema: string, payload: CreateUserDTO) {
    const [loginExists, emailExists, validGroups] = await Promise.all([
      this.usersRepository.findByLogin(schema, payload.login),
      this.usersRepository.findByEmail(schema, payload.email),
      this.accessGroupsRepository.findManyByIds(payload.groupIds),
    ])

    if (loginExists) {
      throw new AppError('Login já está em uso', 409)
    }

    if (emailExists) {
      throw new AppError('E-mail já está em uso', 409)
    }

    if (validGroups.length !== new Set(payload.groupIds).size) {
      throw new AppError('Um ou mais grupos não foram encontrados', 404)
    }

    const { lojasGestoras, ...userData } = payload
    const user = User.create({
      ...userData,
      groupIds: payload.groupIds,
      allowFeatures: payload.allowFeatures ?? [],
      deniedFeatures: payload.deniedFeatures ?? [],
      updatedBy: payload.createdBy,
    })

    const createdUser = await this.usersRepository.create(schema, user, payload.lojasGestoras)

    // Se a senha foi fornecida, definir diretamente sem enviar email
    if (payload.password) {
      const hashedPassword = await hashPassword(payload.password)
      await this.usersRepository.updatePassword(schema, createdUser.id, hashedPassword)
    } else {
      // Se não foi fornecida, enviar email de setup de senha
      await this.passwordSetup.send(schema, createdUser, payload.web_url)
    }

    return createdUser
  }
}

