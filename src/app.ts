import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import { errorHandler } from './core/middlewares/errorHandler'
import { notFound } from './core/middlewares/notFound'
import { requestLogger } from './core/middlewares/requestLogger'
import { authenticate } from './core/middlewares/authenticate'
import { routeAuthorization } from './core/middlewares/routeAuthorization'
import { swaggerSpec } from './docs/swagger'
import { routes } from './routes/index'

export const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(requestLogger)

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Aplicar middlewares de autenticação e autorização antes das rotas
app.use('/api', authenticate)
app.use('/api', routeAuthorization)
app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

