import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../../../core/errors/AppError'
import { accessGroupRepository } from '../repositories'
import { CreateAccessGroupUseCase } from '../useCases/createAccessGroup/CreateAccessGroupUseCase'
import { DeleteAccessGroupUseCase } from '../useCases/deleteAccessGroup/DeleteAccessGroupUseCase'
import { GetAccessGroupUseCase } from '../useCases/getAccessGroup/GetAccessGroupUseCase'
import { ListAccessGroupsUseCase } from '../useCases/listAccessGroups/ListAccessGroupsUseCase'
import { UpdateAccessGroupUseCase } from '../useCases/updateAccessGroup/UpdateAccessGroupUseCase'
import {
  createAccessGroupSchema,
  updateAccessGroupSchema,
} from '../validators/accessGroup.schema'
import { userRepository } from '../../users/repositories'
import { ListUsersUseCase } from '../../users/useCases/listUsers/ListUsersUseCase'

export class AccessGroupController {
  constructor(
    private readonly listGroups: ListAccessGroupsUseCase,
    private readonly getGroup: GetAccessGroupUseCase,
    private readonly createGroup: CreateAccessGroupUseCase,
    private readonly updateGroup: UpdateAccessGroupUseCase,
    private readonly deleteGroup: DeleteAccessGroupUseCase,
  ) { }

  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, feature } = req.query
      const groups = await this.listGroups.execute({
        search: typeof search === 'string' ? search : undefined,
        feature: typeof feature === 'string' ? feature : undefined,
      })

      return res.json(groups)
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
        return res.json({ groups: [], total: 0, page: pageNum, limit: limitNum })
      }

      const groups = await this.listGroups.execute({
        search: searchText,
      })

      const offset = (pageNum - 1) * limitNum
      const paginatedGroups = groups.slice(offset, offset + limitNum)

      return res.json({
        groups: paginatedGroups,
        total: groups.length,
        page: pageNum,
        limit: limitNum,
      })
    } catch (error) {
      return next(error)
    }
  }

  findAdminGroupsPublic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Buscar grupos que contenham "ADMIN" no código
      const allGroups = await this.listGroups.execute({})
      const adminGroups = allGroups.filter((group) =>
        group.code.toUpperCase().includes('ADMIN')
      )

      return res.json(adminGroups)
    } catch (error) {
      return next(error)
    }
  }

  /**
   * Endpoint público para buscar grupo por código com usuários
   * Usado pelo serviço de comunicações para enviar emails para grupos
   */
  findGroupByCodePublic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = req.schema!
      const { code } = req.params

      if (!code) {
        throw new AppError('Código do grupo é obrigatório', 400)
      }

      // Buscar grupo por código
      const group = await accessGroupRepository.findByCode(code.toUpperCase())
      if (!group) {
        return res.json({ data: [] })
      }

      // Buscar usuários do grupo
      const listUsersUseCase = new ListUsersUseCase(userRepository)
      const users = await listUsersUseCase.execute(schema, { groupId: group.id })

      // Formatar resposta no formato esperado pelo serviço de comunicações
      const response = {
        data: [
          {
            id: group.id,
            name: group.name,
            code: group.code,
            usuarios: users.map((user) => ({
              id: user.id,
              id_usuario: user.id,
              email: user.email,
              emailUsuario: user.email,
              login: user.login,
              loginUsuario: user.login,
              fullName: user.fullName,
              idGrupoUsuario: group.id,
              id_grupo_usuario: group.id,
            })),
          },
        ],
      }

      return res.json(response)
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

      const group = await this.getGroup.execute(id)
      return res.json(group)
    } catch (error) {
      return next(error)
    }
  }

  store = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = createAccessGroupSchema.safeParse(req.body)
      if (!parseResult.success) {
        throw new AppError('Falha de validação', 422, parseResult.error.flatten())
      }

      const group = await this.createGroup.execute(parseResult.data)
      return res.status(201).json(group)
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

      const parseResult = updateAccessGroupSchema.safeParse(req.body)
      if (!parseResult.success) {
        throw new AppError('Falha de validação', 422, parseResult.error.flatten())
      }

      const group = await this.updateGroup.execute(id, parseResult.data)
      return res.json(group)
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

      await this.deleteGroup.execute(id)
      return res.status(204).send()
    } catch (error) {
      return next(error)
    }
  }
}

export const accessGroupController = new AccessGroupController(
  new ListAccessGroupsUseCase(accessGroupRepository),
  new GetAccessGroupUseCase(accessGroupRepository),
  new CreateAccessGroupUseCase(accessGroupRepository),
  new UpdateAccessGroupUseCase(accessGroupRepository),
  new DeleteAccessGroupUseCase(accessGroupRepository),
)

