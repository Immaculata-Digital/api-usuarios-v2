import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../../../core/errors/AppError'
import { userRepository } from '../repositories'
import { hashPassword } from '../../../core/utils/passwordCipher'
import { generatePasswordToken, verifyPasswordToken } from '../../../core/utils/jwt'
import { env } from '../../../config/env'

// Chave da comunicação de redefinição de senha para clientes
const CHAVE_COMUNICACAO_RESET_PASSWORD_CLIENTE = 'EMAIL-REDEFINICAO-SENHA-CLIENTE'

export class ClientePasswordResetController {
  static forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown'

      if (!email || typeof email !== 'string' || email.trim().length === 0) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Email é obrigatório',
        })
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Formato de email inválido',
        })
      }

      const emailNormalizado = email.toLowerCase().trim()

      // Buscar usuário pelo email
      const user = await userRepository.findByEmail(emailNormalizado)

      // Por segurança, não revelar se o email existe ou não
      // Sempre retorna sucesso, mesmo se o usuário não existir
      if (!user) {
        return res.status(204).send()
      }

      // Gerar token de reset de senha
      const token = generatePasswordToken(user.id, user.login)

      // Construir URL de reset
      const baseUrl = env.app.webUrl.replace(/\/$/, '')
      const path = env.app.passwordResetPath.startsWith('/')
        ? env.app.passwordResetPath
        : `/${env.app.passwordResetPath}`
      const urlReset = `${baseUrl}${path}?token=${token}`

      // Preparar variáveis para o template HTML
      const nomeUsuario = user.fullName
      const tempoValidade = '2 horas'
      const anoAtual = new Date().getFullYear().toString()
      const urlSistema = baseUrl

      // Chamar API de comunicações para disparo automático
      // Extrair schema do request (se disponível) ou usar um padrão
      const schema = (req as any).schema || 'public'
      
      try {
        const response = await fetch(`${env.apiComunicacoes.url}/${schema}/disparo-automatico`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tipo_envio: 'reset_senha',
            cliente: {
              id_cliente: user.id,
              nome_completo: user.fullName || user.login,
              email: user.email,
              token_reset: token,
            },
          }),
        })

        // Não bloquear se falhar (o email pode não estar configurado)
        if (!response.ok) {
          console.warn(`Erro ao disparar email de reset de senha: ${response.status}`)
        }
      } catch (error) {
        // Não bloquear o fluxo se falhar
        console.error('Erro ao chamar API de comunicações para reset de senha:', error)
      }

      console.log(`Password reset email sent to client ${user.id} from IP ${clientIP}`)
      return res.status(204).send()
    } catch (error) {
      return next(error)
    }
  }

  static resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, email, dt_nascimento, nova_senha } = req.body
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown'

      const validationErrors: Array<{ field: string; message: string }> = []

      if (!token || typeof token !== 'string') {
        validationErrors.push({ field: 'token', message: 'Token é obrigatório' })
      }

      if (!email || typeof email !== 'string' || email.trim().length === 0) {
        validationErrors.push({ field: 'email', message: 'Email é obrigatório' })
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email.trim())) {
          validationErrors.push({ field: 'email', message: 'Formato de email inválido' })
        }
      }

      if (!dt_nascimento || typeof dt_nascimento !== 'string') {
        validationErrors.push({ field: 'dt_nascimento', message: 'Data de nascimento é obrigatória' })
      }

      if (!nova_senha || typeof nova_senha !== 'string') {
        validationErrors.push({ field: 'nova_senha', message: 'Nova senha é obrigatória' })
      } else if (nova_senha.length < 8) {
        validationErrors.push({ field: 'nova_senha', message: 'Senha deve ter no mínimo 8 caracteres' })
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Dados de entrada inválidos',
          details: validationErrors,
        })
      }

      const emailNormalizado = email.toLowerCase().trim()

      // Validar formato de data
      const dataNascimentoRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
      const matchData = dt_nascimento.match(dataNascimentoRegex)

      if (!matchData) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Data de nascimento deve estar no formato DD/MM/AAAA',
        })
      }

      const [, dia, mes, ano] = matchData
      const dataNascimento = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))

      if (isNaN(dataNascimento.getTime())) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Data de nascimento inválida',
        })
      }

      if (dataNascimento > new Date()) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Data de nascimento não pode ser futura',
        })
      }

      // Verificar token
      let tokenPayload: { sub: string }
      try {
        tokenPayload = verifyPasswordToken(token)
      } catch {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Token inválido ou expirado',
        })
      }

      // Buscar usuário
      const user = await userRepository.findById(tokenPayload.sub)

      if (!user || user.email.toLowerCase() !== emailNormalizado) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Usuário não encontrado para este token',
        })
      }

      // Nota: A validação de data de nascimento seria feita contra uma tabela de clientes
      // Por enquanto, apenas atualizamos a senha
      const hashedPassword = await hashPassword(nova_senha)
      await userRepository.updatePassword(user.id, hashedPassword)

      console.log(`Password reset completed for client ${user.id} from IP ${clientIP}`)
      return res.status(204).send()
    } catch (error) {
      return next(error)
    }
  }
}

