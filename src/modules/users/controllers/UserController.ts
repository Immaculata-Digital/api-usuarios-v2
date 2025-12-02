import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../../../core/errors/AppError'
import { accessGroupRepository } from '../../accessGroups/repositories'
import { userRepository } from '../repositories'
import { CreateUserUseCase } from '../useCases/createUser/CreateUserUseCase'
import { DeleteUserUseCase } from '../useCases/deleteUser/DeleteUserUseCase'
import { GetUserUseCase } from '../useCases/getUser/GetUserUseCase'
import { ListUsersUseCase } from '../useCases/listUsers/ListUsersUseCase'
import { UpdateUserUseCase } from '../useCases/updateUser/UpdateUserUseCase'
import { UpdateUserBasicUseCase } from '../useCases/updateUserBasic/UpdateUserBasicUseCase'
import { UpdateUserGroupsUseCase } from '../useCases/updateUserGroups/UpdateUserGroupsUseCase'
import { UpdateUserPermissionsUseCase } from '../useCases/updateUserPermissions/UpdateUserPermissionsUseCase'
import {
  createUserSchema,
  updateUserSchema,
  updateUserBasicSchema,
  updateUserGroupsSchema,
  updateUserPermissionsSchema,
} from '../validators/user.schema'
import { PasswordSetupService } from '../services/PasswordSetupService'
import { hashPassword } from '../../../core/utils/passwordCipher'

export class UserController {
  constructor(
    private readonly listUsers: ListUsersUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly createUser: CreateUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly updateUserBasic: UpdateUserBasicUseCase,
    private readonly updateUserGroups: UpdateUserGroupsUseCase,
    private readonly updateUserPermissions: UpdateUserPermissionsUseCase,
    private readonly deleteUser: DeleteUserUseCase,
  ) { }

  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, groupId, accessGroup, feature } = req.query
      const selectedGroup =
        typeof groupId === 'string'
          ? groupId
          : typeof accessGroup === 'string'
            ? accessGroup
            : undefined
      const users = await this.listUsers.execute({
        search: typeof search === 'string' ? search : undefined,
        groupId: selectedGroup,
        feature: typeof feature === 'string' ? feature : undefined,
      })
      return res.json(users)
    } catch (error) {
      return next(error)
    }
  }

  searchByText = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q, page = '1', limit = '10' } = req.query
      const searchText = typeof q === 'string' ? q : undefined
      const pageNum = parseInt(page as string, 10) || 1
      const limitNum = parseInt(limit as string, 10) || 10

      if (!searchText || searchText.trim().length === 0) {
        return res.json({ users: [], total: 0, page: pageNum, limit: limitNum })
      }

      const users = await this.listUsers.execute({
        search: searchText,
      })

      const offset = (pageNum - 1) * limitNum
      const paginatedUsers = users.slice(offset, offset + limitNum)

      return res.json({
        users: paginatedUsers,
        total: users.length,
        page: pageNum,
        limit: limitNum,
      })
    } catch (error) {
      return next(error)
    }
  }

  createPublicClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { login, senha, email } = req.body

      if (!login || !senha || !email) {
        throw new AppError('Login, senha e email são obrigatórios', 400)
      }

      // Buscar grupo de clientes (assumindo que existe um grupo com código "CLIENTES")
      const clientGroup = await accessGroupRepository.findByCode('CLIENTES')
      if (!clientGroup) {
        throw new AppError('Grupo de clientes não encontrado', 404)
      }

      // Verificar se já existe usuário com esse login ou email
      const [loginExists, emailExists] = await Promise.all([
        userRepository.findByLogin(login.trim()),
        userRepository.findByEmail(email.trim().toLowerCase()),
      ])

      if (loginExists) {
        throw new AppError('Login já está em uso', 409)
      }

      if (emailExists) {
        throw new AppError('E-mail já está em uso', 409)
      }

      // Criar usuário cliente
      const user = await this.createUser.execute({
        fullName: login.trim(),
        login: login.trim(),
        email: email.trim().toLowerCase(),
        groupIds: [clientGroup.id],
        createdBy: 'system',
      })

      // Definir senha diretamente
      const hashedPassword = await hashPassword(senha)
      await userRepository.updatePassword(user.id, hashedPassword)

      return res.status(201).json({
        id: user.id,
        login: user.login,
        email: user.email,
        idGrupoUsuario: clientGroup.id,
      })
    } catch (error) {
      return next(error)
    }
  }

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params

      if (!id) {
        throw new AppError('Parâmetro id é obrigatório', 400)
      }

      const user = await this.getUser.execute(id)
      return res.json(user)
    } catch (error) {
      return next(error)
    }
  }

  store = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = createUserSchema.safeParse(req.body)
      if (!parseResult.success) {
        throw new AppError('Falha de validação', 422, parseResult.error.flatten())
      }

      const user = await this.createUser.execute(parseResult.data)
      return res.status(201).json(user)
    } catch (error) {
      return next(error)
    }
  }

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params

      if (!id) {
        throw new AppError('Parâmetro id é obrigatório', 400)
      }

      const parseResult = updateUserSchema.safeParse(req.body)
      if (!parseResult.success) {
        throw new AppError('Falha de validação', 422, parseResult.error.flatten())
      }

      const user = await this.updateUser.execute(id, parseResult.data)
      return res.json(user)
    } catch (error) {
      return next(error)
    }
  }

  updateBasic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params

      if (!id) {
        throw new AppError('Parâmetro id é obrigatório', 400)
      }

      const parseResult = updateUserBasicSchema.safeParse(req.body)
      if (!parseResult.success) {
        throw new AppError('Falha de validação', 422, parseResult.error.flatten())
      }

      const user = await this.updateUserBasic.execute(id, parseResult.data)
      return res.json(user)
    } catch (error) {
      return next(error)
    }
  }

  updateGroups = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params

      if (!id) {
        throw new AppError('Parâmetro id é obrigatório', 400)
      }

      const parseResult = updateUserGroupsSchema.safeParse(req.body)
      if (!parseResult.success) {
        throw new AppError('Falha de validação', 422, parseResult.error.flatten())
      }

      const user = await this.updateUserGroups.execute(id, parseResult.data)
      return res.json(user)
    } catch (error) {
      return next(error)
    }
  }

  updatePermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params

      if (!id) {
        throw new AppError('Parâmetro id é obrigatório', 400)
      }

      const parseResult = updateUserPermissionsSchema.safeParse(req.body)
      if (!parseResult.success) {
        throw new AppError('Falha de validação', 422, parseResult.error.flatten())
      }

      const user = await this.updateUserPermissions.execute(id, parseResult.data)
      return res.json(user)
    } catch (error) {
      return next(error)
    }
  }

  destroy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params

      if (!id) {
        throw new AppError('Parâmetro id é obrigatório', 400)
      }

      await this.deleteUser.execute(id)
      return res.status(204).send()
    } catch (error) {
      return next(error)
    }
  }
}

export const userController = new UserController(
  new ListUsersUseCase(userRepository),
  new GetUserUseCase(userRepository),
  new CreateUserUseCase(userRepository, accessGroupRepository, new PasswordSetupService()),
  new UpdateUserUseCase(userRepository, accessGroupRepository),
  new UpdateUserBasicUseCase(userRepository),
  new UpdateUserGroupsUseCase(userRepository, accessGroupRepository),
  new UpdateUserPermissionsUseCase(userRepository),
  new DeleteUserUseCase(userRepository),
)

