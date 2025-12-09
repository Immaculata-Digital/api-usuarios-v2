import { z } from 'zod'
import { formatGroupCode } from '../../../core/utils/formatGroupCode'
import {
  FEATURE_KEYS,
  formatFeatureKey,
  isValidFeatureKey,
} from '../../features/catalog'

const featuresSchema = z
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

const codeSchema = z
  .string()
  .min(3)
  .max(100)
  .transform((value) => formatGroupCode(value))
  .refine((value) => /^[A-Z0-9-]+$/.test(value), {
    message: 'Código deve conter apenas letras, números e hífens',
  })

export const createAccessGroupSchema = z.object({
  name: z.string().min(3).max(120),
  code: codeSchema,
  features: featuresSchema,
  createdBy: z.string().min(3),
})

export const updateAccessGroupSchema = z
  .object({
    name: z.string().min(3).max(120).optional(),
    code: codeSchema.optional(),
    features: featuresSchema,
    updatedBy: z.string().min(3),
  })
  .refine((data) => Object.keys(data).some((key) => key !== 'updatedBy'), {
    message: 'Informe ao menos um campo para atualizar',
    path: ['body'],
  })

