import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken'
import { env } from '../../config/env'

// Token para setup de senha
type PasswordSetupTokenPayload = JwtPayload & {
  type: 'password_setup'
  login: string
}

// Token de autenticação (access token)
export interface AuthTokenPayload extends JwtPayload {
  type: 'access'
  userId: string
  login: string
  email: string
  permissions: string[]
}

// Token de refresh
export interface RefreshTokenPayload extends JwtPayload {
  type: 'refresh'
  userId: string
}

export const generatePasswordToken = (userId: string, login: string) => {
  const payload: PasswordSetupTokenPayload = {
    type: 'password_setup',
    login,
  }

  const options: SignOptions = {
    subject: userId,
    expiresIn: '12h', // Token de reset de senha expira em 12 horas
  }

  return jwt.sign(payload, env.security.jwtSecret, options)
}

export const verifyPasswordToken = (token: string) => {
  const payload = jwt.verify(token, env.security.jwtSecret) as PasswordSetupTokenPayload
  if (payload.type !== 'password_setup') {
    throw new Error('Invalid token type')
  }
  if (!payload.sub) {
    throw new Error('Invalid token payload')
  }
  return payload as PasswordSetupTokenPayload & { sub: string }
}

/**
 * Gera um access token com permissões do usuário
 */
export const generateAccessToken = (data: {
  userId: string
  login: string
  email: string
  permissions: string[]
}): string => {
  const payload: AuthTokenPayload = {
    type: 'access',
    userId: data.userId,
    login: data.login,
    email: data.email,
    permissions: data.permissions,
    iat: Math.floor(Date.now() / 1000),
  }

  const options: SignOptions = {
    subject: data.userId,
    expiresIn: env.security.accessTokenTTL, // Access token expira conforme configurado (padrão: 12h)
  }

  return jwt.sign(payload, env.security.jwtSecret, options)
}

/**
 * Gera um refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  const payload: RefreshTokenPayload = {
    type: 'refresh',
    userId,
    iat: Math.floor(Date.now() / 1000),
  }

  const options: SignOptions = {
    subject: userId,
    expiresIn: '7d', // Refresh token expira em 7 dias
  }

  return jwt.sign(payload, env.security.jwtSecret, options)
}

/**
 * Verifica e decodifica um access token
 */
export const verifyAccessToken = (token: string): AuthTokenPayload => {
  const payload = jwt.verify(token, env.security.jwtSecret) as AuthTokenPayload
  if (payload.type !== 'access') {
    throw new Error('Invalid token type')
  }
  if (!payload.sub || !payload.userId) {
    throw new Error('Invalid token payload')
  }
  return payload
}

/**
 * Verifica e decodifica um refresh token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload & { sub: string } => {
  const payload = jwt.verify(token, env.security.jwtSecret) as RefreshTokenPayload
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type')
  }
  if (!payload.sub || !payload.userId) {
    throw new Error('Invalid token payload')
  }
  return payload as RefreshTokenPayload & { sub: string }
}

