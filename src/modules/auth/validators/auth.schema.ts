import { z } from 'zod'

export const loginSchema = z.object({
  loginOrEmail: z.string().min(1, 'Login ou e-mail é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
})

