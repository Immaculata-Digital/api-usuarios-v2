import { Router } from 'express'
import { accessGroupController } from '../controllers/AccessGroupController'

export const accessGroupRoutes = Router()

// Rota pública para buscar grupos admin
accessGroupRoutes.get('/public/admin', accessGroupController.findAdminGroupsPublic)

// Rotas protegidas
accessGroupRoutes
  .route('/')
  .get(accessGroupController.index)
  .post(accessGroupController.store)

accessGroupRoutes.get('/buscar-por-texto', accessGroupController.searchByText)

accessGroupRoutes
  .route('/:id')
  .get(accessGroupController.show)
  .put(accessGroupController.update)
  .delete(accessGroupController.destroy)

