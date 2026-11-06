import { Router } from 'express'
import { ROUTES } from '../../../constants/common/routes.constants'
import * as authController from '../../../controllers/users/auth/auth.controller'
import { registerSchema } from '../../../dtos/users/auth/register.dto'
import { loginSchema } from '../../../dtos/users/auth/login.dto'
import { refreshTokenSchema } from '../../../dtos/users/auth/refresh-token.dto'
import { sessionParamsSchema } from '../../../dtos/users/session/session-params.dto'
import { authenticate } from '../../../middlewares/auth/authenticate.middleware'
import { validate } from '../../../middlewares/request/validate.middleware'
import { authRateLimit, refreshRateLimit } from '../../../middlewares/security/rate-limit.middleware'

const A = ROUTES.AUTH

export const authRoutes = Router()

authRoutes.post(A.REGISTER, authRateLimit, validate({ body: registerSchema }), authController.register)
authRoutes.post(A.LOGIN, authRateLimit, validate({ body: loginSchema }), authController.login)
// Refreshing is routine (every tab, every 15 minutes), so it has its own, looser limit.
authRoutes.post(A.REFRESH, refreshRateLimit, validate({ body: refreshTokenSchema }), authController.refresh)
authRoutes.post(A.LOGOUT, authenticate, authController.logout)
authRoutes.post(A.LOGOUT_ALL, authenticate, authController.logoutEverywhere)
authRoutes.get(A.SESSIONS, authenticate, authController.listSessions)
authRoutes.delete(A.SESSION, authenticate, validate({ params: sessionParamsSchema }), authController.revokeSession)
