import type { HydratedDocument, Model, QueryFilter, UpdateQuery } from 'mongoose'
import type { BaseEntity } from '../../interfaces/models/base/base-entity.interface'
import type { PageRequestDto } from '../../dtos/common/pagination/page-request.dto'
import type { PageResult } from '../../interfaces/common/pagination/page-result.interface'
import type { PaginateOptions } from '../../interfaces/repositories/base/paginate-options.interface'
import { buildPageMeta, toSkip, toSort } from '../../utilities/pagination/paginate.utility'
import { toObjectId, toOptionalObjectId } from '../../utilities/ids/object-id.utility'

// Shared persistence: audit fields, soft-delete filtering, and pagination for every model.
export abstract class BaseRepository<T extends BaseEntity> {
  protected constructor(protected readonly model: Model<T>) {}

  protected active(filter: QueryFilter<T> = {}): QueryFilter<T> {
    return { ...filter, deletedAt: null } as QueryFilter<T>
  }

  async create(data: Partial<T>, actorId: string | null): Promise<HydratedDocument<T>> {
    const actor = toOptionalObjectId(actorId)
    const document = new this.model({ ...data, createdBy: actor, updatedBy: actor })
    return document.save()
  }

  findById(id: string, projection?: string) {
    return this.model.findOne(this.active({ _id: toObjectId(id) } as QueryFilter<T>), projection)
  }

  async exists(filter: QueryFilter<T>): Promise<boolean> {
    return (await this.model.exists(this.active(filter))) !== null
  }

  updateById(id: string, update: UpdateQuery<T>, actorId: string | null) {
    const changes = { ...update, $set: { ...(update.$set ?? {}), updatedBy: toOptionalObjectId(actorId) } }
    return this.model.findOneAndUpdate(this.active({ _id: toObjectId(id) } as QueryFilter<T>), changes, {
      returnDocument: 'after',
      runValidators: true
    })
  }

  async softDeleteById(id: string, actorId: string | null): Promise<boolean> {
    const actor = toOptionalObjectId(actorId)
    const result = await this.model.updateOne(this.active({ _id: toObjectId(id) } as QueryFilter<T>), {
      $set: { deletedAt: new Date(), deletedBy: actor, updatedBy: actor }
    } as UpdateQuery<T>)
    return result.modifiedCount === 1
  }

  /** TResult describes the item shape after `options.populate` is applied. */
  async paginate<TResult = HydratedDocument<T>>(
    filter: QueryFilter<T>,
    request: PageRequestDto,
    options: PaginateOptions = {}
  ): Promise<PageResult<TResult>> {
    const scopedFilter = this.active(filter)
    const query = this.model
      .find(scopedFilter, options.projection)
      .sort(toSort(request))
      .skip(toSkip(request.page, request.pageSize))
      .limit(request.pageSize)
    if (options.populate) query.populate(options.populate)

    const [items, totalItems] = await Promise.all([query.exec(), this.model.countDocuments(scopedFilter)])
    return { items: items as TResult[], meta: buildPageMeta(request.page, request.pageSize, totalItems) }
  }
}
