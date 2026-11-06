import { z } from 'zod'
import { ADMIN_REQUEST_SORT_FIELDS } from '../../../constants/users/admin-request/admin-request.constants'
import { AdminRequestStatus } from '../../../enums/users/admin-request/admin-request-status.enum'
import { buildPageRequestSchema } from '../../../validations/common/pagination.validation'

export const adminRequestQuerySchema = buildPageRequestSchema(ADMIN_REQUEST_SORT_FIELDS, 'createdAt').extend({
  status: z.enum(AdminRequestStatus).optional()
})

export type AdminRequestQueryDto = z.infer<typeof adminRequestQuerySchema>
