import { Router } from 'express'
import { ROUTES } from '../../../constants/common/routes.constants'
import { Role } from '../../../enums/users/roles/role.enum'
import * as adminRequestController from '../../../controllers/users/admin-request/admin-request.controller'
import { createAdminRequestSchema } from '../../../dtos/users/admin-request/create-admin-request.dto'
import { decideAdminRequestSchema } from '../../../dtos/users/admin-request/decide-admin-request.dto'
import { adminRequestQuerySchema } from '../../../dtos/users/admin-request/admin-request-query.dto'
import { adminRequestParamsSchema } from '../../../dtos/users/admin-request/admin-request-params.dto'
import { authenticate } from '../../../middlewares/auth/authenticate.middleware'
import { authorize } from '../../../middlewares/auth/authorize.middleware'
import { validate } from '../../../middlewares/request/validate.middleware'

const { ROOT, BY_ID, DECISION } = ROUTES.ADMIN_REQUESTS
const byId = validate({ params: adminRequestParamsSchema })

export const adminRequestRoutes = Router()

adminRequestRoutes.use(authenticate)
adminRequestRoutes.post(ROOT, validate({ body: createAdminRequestSchema }), adminRequestController.createRequest)
adminRequestRoutes.get(ROOT, validate({ query: adminRequestQuerySchema }), adminRequestController.listRequests)
adminRequestRoutes.get(BY_ID, byId, adminRequestController.getRequest)
adminRequestRoutes.patch(
  DECISION,
  authorize(Role.ADMIN),
  validate({ params: adminRequestParamsSchema, body: decideAdminRequestSchema }),
  adminRequestController.decideRequest
)
adminRequestRoutes.delete(BY_ID, byId, adminRequestController.cancelRequest)
