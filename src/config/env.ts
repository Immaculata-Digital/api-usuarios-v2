import { config } from 'dotenv'

config()

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  app: {
    port: Number(process.env.PORT ?? 7772),
    webUrl: process.env.APP_WEB_URL ?? 'http://localhost:5173',
    passwordResetPath: process.env.PASSWORD_RESET_PATH ?? '/account/set-password',
  },
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    name: process.env.DB_NAME ?? 'immaculata',
    user: process.env.DB_USER ?? 'developer',
    password: process.env.DB_PASS ?? '',
  },
  security: {
    jwtSecret: process.env.JWT_SECRET ?? 'default-jwt-secret',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'default-jwt-refresh-secret',
    jwtExpiresIn: process.env.ACCESS_TOKEN_TTL ?? process.env.JWT_EXPIRES_IN ?? '12h',
    jwtIssuer: process.env.JWT_ISS ?? 'api-usuarios',
    jwtAudience: process.env.JWT_AUD ?? 'api-usuarios',
    jwtAlgorithm: process.env.JWT_ALG ?? 'HS256',
    accessTokenTTL: process.env.ACCESS_TOKEN_TTL ?? '12h',
    refreshTokenTTL: process.env.REFRESH_TOKEN_TTL ?? '7d',
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 12),
    cryptoSecret: process.env.CRYPTO_SECRET ?? 'default-crypto-secret',
  },
  cors: {
    origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
  },
  logging: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
  apiComunicacoes: {
    url: process.env.API_COMUNICACOES_URL ?? 'http://localhost:3336/api',
  },
}

