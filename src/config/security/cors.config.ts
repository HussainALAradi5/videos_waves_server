import type { CorsOptions } from 'cors'
import { env } from '../index'

export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    // Non-browser clients (mobile app, curl) send no Origin header.
    if (!origin || env.CORS_ORIGINS.includes(origin)) {
      callback(null, true)
      return
    }
    callback(null, false)
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id']
}
