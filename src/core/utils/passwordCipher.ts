import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { env } from '../../config/env'

const ALGORITHM = 'aes-256-ctr'
const IV_LENGTH = 16
const SALT_ROUNDS = 10

const getKey = () =>
  createHash('sha256').update(env.security.cryptoSecret).digest().subarray(0, 32)

// Funções de hash de senha usando bcrypt
export const hashPassword = async (plainText: string): Promise<string> => {
  return await bcrypt.hash(plainText, SALT_ROUNDS)
}

export const comparePassword = async (plainText: string, storedPassword: string): Promise<boolean> => {
  // Verificar se é formato bcrypt (começa com $2)
  if (storedPassword.startsWith('$2')) {
    return await bcrypt.compare(plainText, storedPassword)
  }
  
  // Se não for bcrypt, pode ser formato de criptografia (iv:encrypted)
  // Tentar descriptografar e comparar
  try {
    const decrypted = decryptPassword(storedPassword)
    return decrypted === plainText
  } catch {
    // Se não conseguir descriptografar, comparar diretamente (fallback)
    return storedPassword === plainText
  }
}

// Funções de criptografia simétrica (para outros casos de uso)
export const encryptPassword = (plainText: string) => {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

export const decryptPassword = (hash: string) => {
  const [ivHex, encryptedHex] = hash.split(':')
  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid encrypted password format')
  }
  const iv = Buffer.from(ivHex, 'hex')
  const encryptedText = Buffer.from(encryptedHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv)
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()])
  return decrypted.toString('utf8')
}

