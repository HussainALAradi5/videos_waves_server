import type { QueryFilter } from 'mongoose'
import { MESSAGES } from '../../../constants/common/messages.constants'
import { USER_PUBLIC_FIELDS } from '../../../constants/users/user/user.constants'
import { Role } from '../../../enums/users/roles/role.enum'
import { AdminRequestStatus } from '../../../enums/users/admin-request/admin-request-status.enum'
import type { CreateAdminRequestDto } from '../../../dtos/users/admin-request/create-admin-request.dto'
import type { DecideAdminRequestDto } from '../../../dtos/users/admin-request/decide-admin-request.dto'
import type { AdminRequestQueryDto } from '../../../dtos/users/admin-request/admin-request-query.dto'
import type { AdminRequestResponseDto } from '../../../dtos/users/admin-request/admin-request-response.dto'
import type { AuthUser } from '../../../interfaces/auth/auth-user.interface'
import type { AdminRequest } from '../../../interfaces/models/users/admin-request/admin-request.interface'
import type { AdminRequestWithRequester } from '../../../interfaces/models/users/admin-request/admin-request-with-requester.interface'
import type { PublicUserSource } from '../../../interfaces/models/users/user/public-user-source.interface'
import type { PageResult } from '../../../interfaces/common/pagination/page-result.interface'
import { adminRequestRepository } from '../../../repositories/users/admin-request/admin-request.repository'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { toAdminRequestResponse } from '../../../mappers/users/admin-request/admin-request.mapper'
import { assertCanManage } from '../../../validations/common/ownership.validation'
import { conflict, notFound } from '../../../utilities/errors/app-error.utility'
import { toObjectId } from '../../../utilities/ids/object-id.utility'

const REQUESTER_POPULATE = { path: 'requester', select: USER_PUBLIC_FIELDS }

const getRequestResponse = async (requestId: string): Promise<AdminRequestResponseDto> => {
  const request = await adminRequestRepository
    .findById(requestId)
    .populate<{ requester: PublicUserSource }>(REQUESTER_POPULATE)
  if (!request) throw notFound(MESSAGES.ADMIN_REQUESTS.NOT_FOUND)
  return toAdminRequestResponse(request)
}

const findRequestOrFail = async (requestId: string) => {
  const request = await adminRequestRepository.findById(requestId)
  if (!request) throw notFound(MESSAGES.ADMIN_REQUESTS.NOT_FOUND)
  return request
}

/** Distinguishes "not found" from "no longer pending" after a failed atomic transition. */
const throwTransitionFailure = async (requestId: string): Promise<never> => {
  await findRequestOrFail(requestId)
  throw conflict(MESSAGES.ADMIN_REQUESTS.ALREADY_DECIDED)
}

export const createAdminRequest = async (
  dto: CreateAdminRequestDto,
  actor: AuthUser
): Promise<AdminRequestResponseDto> => {
  if (actor.role === Role.ADMIN) throw conflict(MESSAGES.ADMIN_REQUESTS.ALREADY_ADMIN)
  if (await adminRequestRepository.hasPending(actor.id)) throw conflict(MESSAGES.ADMIN_REQUESTS.PENDING_EXISTS)
  const request = await adminRequestRepository.create(
    { requester: toObjectId(actor.id), reason: dto.reason },
    actor.id
  )
  return getRequestResponse(request._id.toString())
}

/** Admins see every request; other users see only their own. */
export const listAdminRequests = async (
  query: AdminRequestQueryDto,
  actor: AuthUser
): Promise<PageResult<AdminRequestResponseDto>> => {
  const filter: QueryFilter<AdminRequest> = {}
  if (actor.role !== Role.ADMIN) filter.requester = toObjectId(actor.id)
  if (query.status) filter.status = query.status
  const page = await adminRequestRepository.paginate<AdminRequestWithRequester>(filter, query, {
    populate: REQUESTER_POPULATE
  })
  return { items: page.items.map(toAdminRequestResponse), meta: page.meta }
}

export const getAdminRequest = async (requestId: string, actor: AuthUser): Promise<AdminRequestResponseDto> => {
  const request = await findRequestOrFail(requestId)
  assertCanManage(request.requester, actor, true)
  return getRequestResponse(requestId)
}

/** pending -> accepted | rejected. Accepting promotes the requester to admin. */
export const decideAdminRequest = async (
  requestId: string,
  dto: DecideAdminRequestDto,
  actor: AuthUser
): Promise<AdminRequestResponseDto> => {
  const decided = await adminRequestRepository.transitionFromPending(
    requestId,
    { status: dto.status, decidedBy: toObjectId(actor.id), decidedAt: new Date(), decisionNote: dto.note ?? null },
    actor.id
  )
  if (!decided) return throwTransitionFailure(requestId)
  if (dto.status === AdminRequestStatus.ACCEPTED) {
    await userRepository.updateById(decided.requester.toString(), { $set: { role: Role.ADMIN } }, actor.id)
  }
  return getRequestResponse(requestId)
}

/** pending -> cancelled, by the requester only. */
export const cancelAdminRequest = async (requestId: string, actor: AuthUser): Promise<AdminRequestResponseDto> => {
  const request = await findRequestOrFail(requestId)
  assertCanManage(request.requester, actor, false)
  const cancelled = await adminRequestRepository.transitionFromPending(
    requestId,
    { status: AdminRequestStatus.CANCELLED },
    actor.id
  )
  if (!cancelled) return throwTransitionFailure(requestId)
  return getRequestResponse(requestId)
}
