import { AdminRequestModel } from '../../../models/users/admin-request/admin-request.model'
import type { AdminRequest } from '../../../interfaces/models/users/admin-request/admin-request.interface'
import { AdminRequestStatus } from '../../../enums/users/admin-request/admin-request-status.enum'
import { BaseRepository } from '../../base/base.repository'
import { toObjectId } from '../../../utilities/ids/object-id.utility'

class AdminRequestRepository extends BaseRepository<AdminRequest> {
  constructor() {
    super(AdminRequestModel)
  }

  async hasPending(requesterId: string): Promise<boolean> {
    return this.exists({ requester: toObjectId(requesterId), status: AdminRequestStatus.PENDING })
  }

  /** Atomically moves a pending request to its final status; returns null when it was not pending. */
  transitionFromPending(id: string, changes: Partial<AdminRequest>, actorId: string) {
    return this.model.findOneAndUpdate(
      this.active({ _id: toObjectId(id), status: AdminRequestStatus.PENDING }),
      { $set: { ...changes, updatedBy: toObjectId(actorId) } },
      { returnDocument: 'after', runValidators: true }
    )
  }
}

export const adminRequestRepository = new AdminRequestRepository()
