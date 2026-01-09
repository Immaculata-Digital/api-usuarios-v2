import { env } from '../../../config/env'
import type { UserProps } from '../entities/User'
import { generatePasswordToken } from '../../../core/utils/jwt'

// Chave da comunicação de redefinição de senha
const CHAVE_COMUNICACAO_RESET_PASSWORD = 'EMAIL-REDEFINICAO-SENHA'

export class PasswordSetupService {
  async send(schema: string, user: UserProps, webUrl?: string) {
    const token = generatePasswordToken(user.id, user.login)
    
    // Determinar URL base: prioridade: webUrl recebido > env
    let baseUrl = webUrl ? webUrl.replace(/\/$/, '') : env.app.webUrl.replace(/\/$/, '')
    
    // Validar se a URL está completa (deve começar com http:// ou https://)
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      console.error('⚠️ [PasswordSetupService] URL não está configurada corretamente:', baseUrl)
      // Tentar construir uma URL válida assumindo que é apenas o domínio
      if (baseUrl && !baseUrl.includes('://')) {
        baseUrl = `https://${baseUrl}`
        console.warn('⚠️ [PasswordSetupService] Tentando corrigir URL:', baseUrl)
      } else {
        throw new Error('URL não está configurada corretamente. Deve ser uma URL completa (ex: https://app.exemplo.com)')
      }
    }

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

