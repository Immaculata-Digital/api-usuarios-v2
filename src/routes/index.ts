import { Router } from 'express'
import { authRoutes } from '../modules/auth/routes/auth.routes'
import { featureRoutes } from '../modules/features/routes/feature.routes'
import { accessGroupRoutes } from '../modules/accessGroups/routes/accessGroup.routes'
import { userRoutes } from '../modules/users/routes/user.routes'
import { menuRoutes } from '../modules/menus/routes/menu.routes'
import { clientePasswordResetRoutes } from '../modules/users/routes/cliente-password-reset.routes'

export const routes = Router()

routes.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

routes.use('/auth', authRoutes)
routes.use('/users', userRoutes)
routes.use('/groups', accessGroupRoutes)
routes.use('/features', featureRoutes)
routes.use('/menus', menuRoutes)

// Rotas para clientes (sem autenticação)
routes.use('/clientes/auth', clientePasswordResetRoutes)

