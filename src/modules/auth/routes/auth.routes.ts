import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'
import { LoginUseCase } from '../useCases/login/LoginUseCase'
import { LogoutUseCase } from '../useCases/logout/LogoutUseCase'
import { PermissionService } from '../services/PermissionService'
import { userRepository } from '../../users/repositories'
import { accessGroupRepository } from '../../accessGroups/repositories'
import { authenticate } from '../../../core/middlewares/authenticate'

const authRoutes = Router()

import { RefreshTokenUseCase } from '../useCases/refreshToken/RefreshTokenUseCase'

// Instanciar dependências
const permissionService = new PermissionService(accessGroupRepository)
const loginUseCase = new LoginUseCase(userRepository, permissionService)
const logoutUseCase = new LogoutUseCase()
const refreshTokenUseCase = new RefreshTokenUseCase(userRepository, permissionService)
const authController = new AuthController(loginUseCase, logoutUseCase, refreshTokenUseCase)

authRoutes.post('/login', authController.login)
authRoutes.post('/logout', authController.logout)
authRoutes.post('/refresh-token', authController.refreshToken)
authRoutes.post('/refresh', authController.refreshToken) // Alias para compatibilidade
authRoutes.get('/check-url-permission', authenticate, authController.checkUrlPermission)

export { authRoutes }

