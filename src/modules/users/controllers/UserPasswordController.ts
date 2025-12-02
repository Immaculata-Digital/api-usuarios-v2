import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../../../core/errors/AppError'
import { SetPasswordUseCase } from '../useCases/setPassword/SetPasswordUseCase'
import { RequestPasswordResetUseCase } from '../useCases/requestPasswordReset/RequestPasswordResetUseCase'
import { userRepository } from '../repositories'
import { setPasswordSchema } from '../validators/setPassword.schema'
import { requestPasswordResetSchema } from '../validators/requestPasswordReset.schema'

export class UserPasswordController {
  constructor(
    private readonly setPassword: SetPasswordUseCase,
    private readonly requestPasswordReset: RequestPasswordResetUseCase,
  ) {}

  store = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = setPasswordSchema.safeParse(req.body)
      if (!parseResult.success) {
        throw new AppError('Falha de validação', 422, parseResult.error.flatten())
      }

      await this.setPassword.execute(parseResult.data.token, parseResult.data.password)
      return res.status(204).send()
    } catch (error) {
      return next(error)
    }
  }

  requestReset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = requestPasswordResetSchema.safeParse(req.body)
      if (!parseResult.success) {
        throw new AppError('Falha de validação', 422, parseResult.error.flatten())
      }

      await this.requestPasswordReset.execute(parseResult.data.email)
      
      // Sempre retorna sucesso para não revelar se o email existe
      return res.status(200).json({
        status: 'success',
        message: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.',
      })
    } catch (error) {
      return next(error)
    }
  }
}

export const userPasswordController = new UserPasswordController(
  new SetPasswordUseCase(userRepository),
  new RequestPasswordResetUseCase(userRepository),
)

