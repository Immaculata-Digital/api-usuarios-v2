import { Router } from 'express'
import { ClientePasswordResetController } from '../controllers/ClientePasswordResetController'

export const clientePasswordResetRoutes = Router()

clientePasswordResetRoutes.post('/password/forgot', ClientePasswordResetController.forgotPassword)
clientePasswordResetRoutes.post('/password/reset', ClientePasswordResetController.resetPassword)

