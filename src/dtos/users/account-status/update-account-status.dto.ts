import { z } from 'zod'

export const updateAccountStatusSchema = z.object({ isActive: z.boolean() })

export type UpdateAccountStatusDto = z.infer<typeof updateAccountStatusSchema>
