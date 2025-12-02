import { Router } from 'express'
import { userController } from '../controllers/UserController'
import { userPermissionsController } from '../controllers/UserPermissionsController'
import { userPasswordController } from '../controllers/UserPasswordController'

export const userRoutes = Router()

// Rotas públicas (sem autenticação)
userRoutes.post('/clientes/publico', userController.createPublicClient)
userRoutes.post('/password/reset-request', userPasswordController.requestReset)
userRoutes.post('/password/reset', userPasswordController.store)

// Rotas protegidas - rotas específicas primeiro (antes de :id)
userRoutes.get('/buscar-por-texto', userController.searchByText)
userRoutes.get('/my-permissions', userPermissionsController.myPermissions)

// Rotas CRUD padrão
userRoutes.get('/', userController.index)
userRoutes.post('/', userController.store)
userRoutes.get('/:id', userController.show)
userRoutes.get('/:id/permissions', userPermissionsController.show)
userRoutes.put('/:id', userController.update)
userRoutes.put('/:id/basic', userController.updateBasic)
userRoutes.put('/:id/groups', userController.updateGroups)
userRoutes.put('/:id/permissions', userController.updatePermissions)
userRoutes.delete('/:id', userController.destroy)

