import rawCatalog from './menus.json'
import { normalizeKey } from '../../core/utils/normalizeKey'

export interface MenuDefinition {
    key: string
    category: string
    name: string
    description: string
    url: string
    icon: string
}

const catalog = (rawCatalog as MenuDefinition[]).map((menu) => ({
    ...menu,
    key: normalizeKey(menu.key),
}))

const keySet = new Set<string>()

catalog.forEach((menu) => {
    if (keySet.has(menu.key)) {
        throw new Error(`Chave de menu duplicada: ${menu.key}`)
    }
    keySet.add(menu.key)
})

export const MENU_CATALOG: MenuDefinition[] = catalog
export const MENU_KEY_SET = keySet
export const MENU_KEYS = Array.from(MENU_KEY_SET.values())

export const formatMenuKey = (value: string) => normalizeKey(value)

export const isValidMenuKey = (value: string) => MENU_KEY_SET.has(value)

export const getMenuByKey = (key: string) =>
    MENU_CATALOG.find((menu) => menu.key === key)

