import { Router } from 'express'
import { MENU_CATALOG } from '../catalog'

export const menuRoutes = Router()

menuRoutes.get('/', (_req, res) => {
    res.json(MENU_CATALOG)
})

