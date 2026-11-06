import { Router } from 'express'
import { ROUTES } from '../../../constants/common/routes.constants'
import * as authController from '../../../controllers/users/auth/auth.controller'
import { registerSchema } from '../../../dtos/users/auth/register.dto'
import { loginSchema } from '../../../dtos/users/auth/login.dto'
import { refreshTokenSchema } from '../../../dtos/users/auth/refresh-token.dto'
import { authenticate } from '../../../middlewares/auth/authenticate.middleware'
import { validate } from '../../../middlewares/request/validate.middleware'
import { authRateLimit } from '../../../middlewares/security/rate-limit.middleware'

export const authRoutes = Router()

authRoutes.post(ROUTES.AUTH.REGISTER, authRateLimit, validate({ body: registerSchema }), authController.register)
authRoutes.post(ROUTES.AUTH.LOGIN, authRateLimit, validate({ body: loginSchema }), authController.login)
authRoutes.post(ROUTES.AUTH.REFRESH, authRateLimit, validate({ body: refreshTokenSchema }), authController.refresh)
authRoutes.post(ROUTES.AUTH.LOGOUT, authenticate, authController.logout)
