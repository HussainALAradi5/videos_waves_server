import { z } from 'zod'
import { ADMIN_REQUEST_LIMITS } from '../../../constants/users/admin-request/admin-request.constants'

export const createAdminRequestSchema = z.object({
  reason: z.string().trim().min(ADMIN_REQUEST_LIMITS.REASON_MIN).max(ADMIN_REQUEST_LIMITS.REASON_MAX)
})

export type CreateAdminRequestDto = z.infer<typeof createAdminRequestSchema>
