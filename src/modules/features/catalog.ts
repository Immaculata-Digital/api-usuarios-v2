import rawCatalog from './features.json'
import { normalizeKey } from '../../core/utils/normalizeKey'

export interface FeatureDefinition {
  key: string
  name: string
  description: string
  'api-routes': string[]
}

const catalog = (rawCatalog as FeatureDefinition[]).map((feature) => ({
  ...feature,
  key: normalizeKey(feature.key),
}))

const keySet = new Set<string>()

catalog.forEach((feature) => {
  if (keySet.has(feature.key)) {
    throw new Error(`Chave de funcionalidade duplicada: ${feature.key}`)
  }
  keySet.add(feature.key)
})

export const FEATURE_CATALOG: FeatureDefinition[] = catalog
export const FEATURE_KEY_SET = keySet
export const FEATURE_KEYS = Array.from(FEATURE_KEY_SET.values())

export const formatFeatureKey = (value: string) => normalizeKey(value)

export const isValidFeatureKey = (value: string) => FEATURE_KEY_SET.has(value)

export const getFeatureByKey = (key: string) =>
  FEATURE_CATALOG.find((feature) => feature.key === key)

