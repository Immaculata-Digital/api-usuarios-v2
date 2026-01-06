import { z } from 'zod'
import {
  FEATURE_KEYS,
  formatFeatureKey,
  isValidFeatureKey,
} from '../../features/catalog'

const featureSchema = z
  .array(
    z
      .string()
      .min(3)
      .transform((value) => formatFeatureKey(value))
      .refine((value) => isValidFeatureKey(value), {
        message: `Funcionalidade precisa existir no catálogo (${FEATURE_KEYS.join(', ')})`,
      }),
  )
  .optional()

export const createUserSchema = z.object({
  fullName: z.string().min(3),
  login: z.string().min(3),
  email: z.string().email(),
  groupIds: z.array(z.string().uuid()),
  password: z.string().min(8).optional(),
  allowFeatures: featureSchema,
  deniedFeatures: featureSchema,
  lojasGestoras: z.array(z.number().int().positive()).optional(),
  createdBy: z.string().min(3),
})

export const updateUserSchema = z
  .object({
    fullName: z.string().min(3).optional(),
    login: z.string().min(3).optional(),
    email: z.string().email().optional(),
    groupIds: z.array(z.string().uuid()).optional(),
    allowFeatures: featureSchema,
    deniedFeatures: featureSchema,
    lojasGestoras: z.array(z.number().int().positive()).optional(),
    updatedBy: z.string().min(3),
  })
  .refine((data) => Object.keys(data).some((key) => key !== 'updatedBy'), {
    message: 'Informe ao menos um campo para atualizar',
    path: ['body'],
  })

export const updateUserBasicSchema = z.object({
  fullName: z.string().min(3),
  login: z.string().min(3),
  email: z.string().email(),
  lojasGestoras: z.array(z.number().int().positive()).optional(),
  updatedBy: z.string().min(3),
})

export const updateUserGroupsSchema = z.object({
  groupIds: z.array(z.string().uuid()),
  updatedBy: z.string().min(3),
})

export const updateUserPermissionsSchema = z.object({
  allowFeatures: z
    .array(
      z
        .string()
        .min(3)
        .transform((value) => formatFeatureKey(value))
        .refine((value) => isValidFeatureKey(value), {
          message: `Funcionalidade precisa existir no catálogo (${FEATURE_KEYS.join(', ')})`,
        }),
    ),
  deniedFeatures: z
    .array(
      z
        .string()
        .min(3)
        .transform((value) => formatFeatureKey(value))
        .refine((value) => isValidFeatureKey(value), {
          message: `Funcionalidade precisa existir no catálogo (${FEATURE_KEYS.join(', ')})`,
        }),
    ),
  updatedBy: z.string().min(3),
})

