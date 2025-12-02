import { Router } from 'express'
import { FEATURE_CATALOG } from '../catalog'

export const featureRoutes = Router()

featureRoutes.get('/', (_req, res) => {
  res.json(FEATURE_CATALOG)
})

