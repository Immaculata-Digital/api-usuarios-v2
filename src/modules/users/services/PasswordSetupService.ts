import { env } from '../../../config/env'
import type { UserProps } from '../entities/User'
import { generatePasswordToken } from '../../../core/utils/jwt'

// Chave da comunicação de redefinição de senha
const CHAVE_COMUNICACAO_RESET_PASSWORD = 'EMAIL-REDEFINICAO-SENHA'

export class PasswordSetupService {
  async send(user: UserProps) {
    const token = generatePasswordToken(user.id, user.login)
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
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Erro ao chamar API de comunicações:', error)
      throw error instanceof Error ? error : new Error('Erro ao processar envio de e-mail')
    }
  }
}

