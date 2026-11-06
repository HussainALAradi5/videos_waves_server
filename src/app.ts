import './globals/express/request.globals'
import express, { type Express } from 'express'
import cors from 'cors'
import compression from 'compression'
import { corsConfig } from './config/security/cors.config'
import { JSON_BODY_LIMIT } from './constants/common/limits.constants'
import { requestId } from './middlewares/request/request-id.middleware'
import { requestLogger } from './middlewares/logging/request-logger.middleware'
import { securityHeaders } from './middlewares/security/security-headers.middleware'
import { generalRateLimit } from './middlewares/security/rate-limit.middleware'
import { notFoundHandler } from './middlewares/errors/not-found.middleware'
import { errorHandler } from './middlewares/errors/error-handler.middleware'
import { apiRoutes } from './routes'

export const createApp = (): Express => {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  app.use(requestId)
  app.use(requestLogger)
  app.use(securityHeaders)
  app.use(cors(corsConfig))
  app.use(compression())
  app.use(generalRateLimit)
  app.use(express.json({ limit: JSON_BODY_LIMIT }))

  app.use(apiRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
