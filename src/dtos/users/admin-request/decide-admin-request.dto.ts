import { z } from 'zod'
import { ADMIN_REQUEST_LIMITS } from '../../../constants/users/admin-request/admin-request.constants'
import { AdminRequestStatus } from '../../../enums/users/admin-request/admin-request-status.enum'

export const decideAdminRequestSchema = z.object({
  status: z.enum([AdminRequestStatus.ACCEPTED, AdminRequestStatus.REJECTED]),
  note: z.string().trim().max(ADMIN_REQUEST_LIMITS.NOTE_MAX).optional()
})

export type DecideAdminRequestDto = z.infer<typeof decideAdminRequestSchema>
