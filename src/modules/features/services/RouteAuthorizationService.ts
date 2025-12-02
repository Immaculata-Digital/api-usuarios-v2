import featuresCatalog from '../features.json'

interface FeatureDefinition {
  key: string
  name: string
  description: string
  'api-routes': string[]
}

interface RouteMatch {
  api: string
  method: string
  route: string
}

/**
 * Serviço responsável por verificar autorização de rotas baseado em features
 */
export class RouteAuthorizationService {
  private features: FeatureDefinition[] = featuresCatalog as FeatureDefinition[]

  /**
   * Identifica a API baseado no host/origin da requisição
   */
  public identifyApi(host: string | undefined, origin: string | undefined): string {
    // Se for localhost:3333, considera como api-usuarios
    if (host?.includes('localhost:3333') || origin?.includes('localhost:3333')) {
      return 'api-usuarios'
    }

    // Se for localhost:3334, considera como api-comunicacoes
    if (host?.includes('localhost:3334') || origin?.includes('localhost:3334')) {
      return 'api-comunicacoes'
    }

    // Por padrão, se não identificar, retorna api-usuarios
    return 'api-usuarios'
  }

  /**
   * Normaliza a rota removendo query parameters e prefixo /api se existir
   */
  private normalizeRoute(path: string): string {
    // Remove query parameters
    let normalized = path.split('?')[0]
    
    // Remove o prefixo /api se existir
    if (normalized.startsWith('/api')) {
      normalized = normalized.substring(4) // Remove '/api'
      // Garante que começa com /
      if (!normalized.startsWith('/')) {
        normalized = '/' + normalized
      }
    }
    
    return normalized
  }

  /**
   * Faz match entre uma rota da requisição e uma rota do features.json
   * Considera parâmetros dinâmicos (ex: :id, :userId)
   */
  private routeMatches(requestRoute: string, featureRoute: string): boolean {
    // Normaliza as rotas
    const normalizedRequest = this.normalizeRoute(requestRoute)
    const normalizedFeature = this.normalizeRoute(featureRoute)

    // Divide as rotas em segmentos
    const requestSegments = normalizedRequest.split('/').filter(Boolean)
    const featureSegments = normalizedFeature.split('/').filter(Boolean)

    // Se o número de segmentos for diferente, não faz match
    if (requestSegments.length !== featureSegments.length) {
      return false
    }

    // Compara cada segmento
    for (let i = 0; i < requestSegments.length; i++) {
      const requestSegment = requestSegments[i]
      const featureSegment = featureSegments[i]

      // Se o segmento da feature começa com ':', é um parâmetro dinâmico
      // Nesse caso, qualquer valor faz match
      if (featureSegment.startsWith(':')) {
        continue
      }

      // Se os segmentos não forem iguais, não faz match
      if (requestSegment !== featureSegment) {
        return false
      }
    }

    return true
  }

  /**
   * Parseia uma rota do formato "api:metodo:rota"
   * Considera que a rota pode ter mais de três ":" por causa de parâmetros
   */
  private parseRouteDefinition(routeDefinition: string): RouteMatch | null {
    // Divide por ":" mas precisa considerar que a rota pode ter mais de três ":"
    // O formato é sempre: api:metodo:rota
    // A rota pode ter ":" nos parâmetros, então precisamos dividir apenas os dois primeiros ":"
    const firstColon = routeDefinition.indexOf(':')
    if (firstColon === -1) return null

    const secondColon = routeDefinition.indexOf(':', firstColon + 1)
    if (secondColon === -1) return null

    const api = routeDefinition.substring(0, firstColon)
    const method = routeDefinition.substring(firstColon + 1, secondColon).toLowerCase()
    const route = routeDefinition.substring(secondColon + 1)

    return { api, method, route }
  }

  /**
   * Encontra todas as features que correspondem à rota solicitada
   */
  private findMatchingFeatures(api: string, method: string, route: string): string[] {
    const matchingFeatureKeys: string[] = []

    for (const feature of this.features) {
      for (const routeDef of feature['api-routes']) {
        const parsed = this.parseRouteDefinition(routeDef)
        if (!parsed) continue

        // Verifica se a API e o método correspondem
        if (parsed.api === api && parsed.method === method) {
          // Verifica se a rota faz match (considerando parâmetros)
          if (this.routeMatches(route, parsed.route)) {
            matchingFeatureKeys.push(feature.key)
          }
        }
      }
    }

    return matchingFeatureKeys
  }

  /**
   * Verifica se o usuário tem acesso à rota solicitada
   */
  public checkRouteAccess(
    userPermissions: string[],
    host: string | undefined,
    origin: string | undefined,
    method: string,
    route: string,
  ): { hasAccess: boolean; requiredFeatures: string[] } {
    // Identifica a API
    const api = this.identifyApi(host, origin)

    // Normaliza o método HTTP
    const normalizedMethod = method.toLowerCase()

    // Normaliza a rota
    const normalizedRoute = this.normalizeRoute(route)

    // Encontra as features que correspondem à rota
    const requiredFeatures = this.findMatchingFeatures(api, normalizedMethod, normalizedRoute)

    // Se não encontrou nenhuma feature correspondente, permite o acesso
    // (rotas sem feature definida não precisam de autorização)
    if (requiredFeatures.length === 0) {
      return { hasAccess: true, requiredFeatures: [] }
    }

    // Verifica se o usuário tem pelo menos uma das features necessárias
    const hasAccess = requiredFeatures.some((featureKey) =>
      userPermissions.includes(featureKey),
    )

    return { hasAccess, requiredFeatures }
  }
}

// Exporta uma instância singleton
export const routeAuthorizationService = new RouteAuthorizationService()

