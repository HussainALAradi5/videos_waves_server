import { Router } from 'express'
import { ROUTES } from '../../../constants/common/routes.constants'
import { Role } from '../../../enums/users/roles/role.enum'
import * as userController from '../../../controllers/users/user/user.controller'
import { updateProfileSchema } from '../../../dtos/users/user/update-profile.dto'
import { changePasswordSchema } from '../../../dtos/users/user/change-password.dto'
import { userQuerySchema } from '../../../dtos/users/user/user-query.dto'
import { authenticate } from '../../../middlewares/auth/authenticate.middleware'
import { authorize } from '../../../middlewares/auth/authorize.middleware'
import { validate } from '../../../middlewares/request/validate.middleware'
import { authRateLimit } from '../../../middlewares/security/rate-limit.middleware'

export const userRoutes = Router()

userRoutes.use(authenticate)
userRoutes.get(ROUTES.USERS.ROOT, authorize(Role.ADMIN), validate({ query: userQuerySchema }), userController.listUsers)
userRoutes.get(ROUTES.USERS.ME, userController.getMe)
userRoutes.patch(ROUTES.USERS.ME, validate({ body: updateProfileSchema }), userController.updateMe)
userRoutes.patch(
  ROUTES.USERS.ME_PASSWORD,
  authRateLimit,
  validate({ body: changePasswordSchema }),
  userController.changeMyPassword
)
userRoutes.delete(ROUTES.USERS.ME, userController.deactivateMe)
