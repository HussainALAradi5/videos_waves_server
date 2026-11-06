import type { AdminRequestWithRequester } from '../../../interfaces/models/users/admin-request/admin-request-with-requester.interface'
import type { AdminRequestResponseDto } from '../../../dtos/users/admin-request/admin-request-response.dto'
import { toPublicUser } from '../user/user.mapper'

export const toAdminRequestResponse = (request: AdminRequestWithRequester): AdminRequestResponseDto => ({
  id: request._id.toString(),
  code: request.code,
  reason: request.reason,
  status: request.status,
  requester: toPublicUser(request.requester),
  decidedBy: request.decidedBy?.toString() ?? null,
  decidedAt: request.decidedAt?.toISOString() ?? null,
  decisionNote: request.decisionNote,
  createdAt: request.createdAt.toISOString()
})
