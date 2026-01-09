import { z } from 'zod'

export const requestPasswordResetSchema = z.object({
  email: z.string().email('E-mail inválido'),
  web_url: z.string().url('URL inválida').optional(),
})

