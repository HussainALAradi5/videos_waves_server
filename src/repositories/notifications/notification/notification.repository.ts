import type { Notification } from '../../../interfaces/models/notifications/notification/notification.interface'
import { NotificationModel } from '../../../models/notifications/notification/notification.model'
import { toObjectId } from '../../../utilities/ids/object-id.utility'
import { BaseRepository } from '../../base/base.repository'

class NotificationRepository extends BaseRepository<Notification> {
  constructor() {
    super(NotificationModel)
  }

  countUnread(userId: string, hiddenActorIds: string[]) {
    return this.model.countDocuments(
      this.active({ user: toObjectId(userId), readAt: null, actor: { $nin: hiddenActorIds.map(toObjectId) } })
    )
  }

  /** Marks one of the user's notifications read; null when it is not theirs. */
  markRead(id: string, userId: string) {
    return this.model
      .findOneAndUpdate(this.active({ _id: toObjectId(id), user: toObjectId(userId) }), { $set: { readAt: new Date() } }, { new: true })
      .lean()
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.model.updateMany(this.active({ user: toObjectId(userId), readAt: null }), { $set: { readAt: new Date() } })
    return result.modifiedCount
  }
}

export const notificationRepository = new NotificationRepository()
