import { env } from '../../../config/env'
import type { UserProps } from '../entities/User'
import { generatePasswordToken } from '../../../core/utils/jwt'

// Chave da comunicação de redefinição de senha
const CHAVE_COMUNICACAO_RESET_PASSWORD = 'EMAIL-REDEFINICAO-SENHA'

export class PasswordSetupService {
  async send(schema: string, user: UserProps) {
    const token = generatePasswordToken(user.id, user.login)
    const baseUrl = env.app.webUrl.replace(/\/$/, '')
    const path = env.app.passwordResetPath.startsWith('/')
      ? env.app.passwordResetPath
      : `/${env.app.passwordResetPath}`

    // Preparar variáveis para o template HTML
    const nomeUsuario = user.fullName || user.login

    // Chamar API de comunicações para disparo automático
    // Passar web_url completa para que a API de comunicações construa a URL corretamente
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
            nome_completo: nomeUsuario,
            email: user.email,
            token_reset: token,
          },
          web_url: baseUrl, // Passar a URL base para a API de comunicações construir a URL completa
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `Erro ${response.status}` }))
        const errorMessage = (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') 
          ? error.message 
          : 'Erro ao enviar e-mail de redefinição de senha'
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Erro ao chamar API de comunicações:', error)
      throw error instanceof Error ? error : new Error('Erro ao processar envio de e-mail')
    }
  }
}

