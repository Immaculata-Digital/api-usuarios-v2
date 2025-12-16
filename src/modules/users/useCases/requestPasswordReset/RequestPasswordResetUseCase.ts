import { AppError } from '../../../../core/errors/AppError'
import { generatePasswordToken } from '../../../../core/utils/jwt'
import { env } from '../../../../config/env'
import type { IUserRepository } from '../../repositories/IUserRepository'

// Chave da comunicação de redefinição de senha
const CHAVE_COMUNICACAO_RESET_PASSWORD = 'EMAIL-REDEFINICAO-SENHA'

export class RequestPasswordResetUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(email: string): Promise<void> {
    // Buscar usuário pelo email
    const user = await this.userRepository.findByEmail(email.toLowerCase().trim())

    // Por segurança, não revelar se o email existe ou não
    // Sempre retorna sucesso, mesmo se o usuário não existir
    if (!user) {
      // Retorna sucesso silenciosamente para não revelar se o email existe
      return
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
    const tempoValidade = '2 horas' // Pode ser configurável
    const anoAtual = new Date().getFullYear().toString()
    const urlSistema = baseUrl

    // Chamar API de comunicações
    try {
      const response = await fetch(`${env.apiComunicacoes.url}/comunicacoes/enviar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chave: CHAVE_COMUNICACAO_RESET_PASSWORD,
          destinatario: user.email,
          variaveis: [
            nomeUsuario,      // VAR1
            tempoValidade,   // VAR2
            urlReset,        // VAR3
            anoAtual,        // VAR4
            urlSistema,      // VAR5
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `Erro ${response.status}` }))
        const errorMessage = (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') 
          ? error.message 
          : 'Erro ao enviar e-mail de redefinição de senha'
        throw new AppError(errorMessage, response.status)
      }
    } catch (error) {
      // Se for erro de rede ou da API, loga mas não revela ao usuário
      console.error('Erro ao chamar API de comunicações:', error)
      
      // Se for AppError, propaga
      if (error instanceof AppError) {
        throw error
      }
      
      // Para outros erros, lança erro genérico
      throw new AppError('Erro ao processar solicitação de redefinição de senha', 500)
    }
  }
}

