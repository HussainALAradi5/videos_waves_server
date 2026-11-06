import type { Model, QueryFilter, UpdateQuery } from 'mongoose'
import type { PageRequestDto } from '../../dtos/common/pagination/page-request.dto'
import type { BaseEntity } from '../../interfaces/models/base/base-entity.interface'
import type { PageResult } from '../../interfaces/common/pagination/page-result.interface'
import { toObjectId } from '../../utilities/ids/object-id.utility'
import { BaseRepository } from './base.repository'

/**
 * Shared persistence for directed user-to-user relations (follow, block, restrict): one row per
 * ordered pair, created idempotently and hard-deleted, because a relation has no history to keep.
 */
export abstract class PairRelationRepository<T extends BaseEntity> extends BaseRepository<T> {
  protected constructor(
    model: Model<T>,
    private readonly sourceField: keyof T & string,
    private readonly targetField: keyof T & string
  ) {
    super(model)
  }

  private pair(sourceId: string, targetId: string): QueryFilter<T> {
    return { [this.sourceField]: toObjectId(sourceId), [this.targetField]: toObjectId(targetId) } as QueryFilter<T>
  }

  /** Inserts the relation when missing; returns true only when a new row was stored. */
  async addOnce(sourceId: string, targetId: string): Promise<boolean> {
    const actor = toObjectId(sourceId)
    const result = await this.model.updateOne(
      this.pair(sourceId, targetId),
      { $setOnInsert: { createdBy: actor, updatedBy: actor } } as UpdateQuery<T>,
      { upsert: true }
    )
    return result.upsertedCount === 1
  }

  /** Removes the relation; returns true only when it existed. */
  async remove(sourceId: string, targetId: string): Promise<boolean> {
    return (await this.model.deleteOne(this.pair(sourceId, targetId))).deletedCount === 1
  }

  async has(sourceId: string, targetId: string): Promise<boolean> {
    return (await this.model.exists(this.pair(sourceId, targetId))) !== null
  }

  /** Ids `sourceId` points to, optionally limited to `candidateIds` (one query for a whole page). */
  async findTargetIds(sourceId: string, candidateIds?: string[]): Promise<Set<string>> {
    return this.collectIds(this.sourceField, sourceId, this.targetField, candidateIds)
  }

  /** Ids pointing at `targetId`, optionally limited to `candidateIds`. */
  async findSourceIds(targetId: string, candidateIds?: string[]): Promise<Set<string>> {
    return this.collectIds(this.targetField, targetId, this.sourceField, candidateIds)
  }

  /** A page of relations from `sourceId` (e.g. who I follow), newest first, with the target user populated. */
  paginateTargets<TResult>(sourceId: string, request: PageRequestDto, populateSelect: string, exclude: string[] = []) {
    return this.paginateSide<TResult>(this.sourceField, sourceId, this.targetField, request, populateSelect, exclude)
  }

  /** A page of relations to `targetId` (e.g. my followers), with the source user populated. */
  paginateSources<TResult>(targetId: string, request: PageRequestDto, populateSelect: string, exclude: string[] = []) {
    return this.paginateSide<TResult>(this.targetField, targetId, this.sourceField, request, populateSelect, exclude)
  }

  private paginateSide<TResult>(
    fixedField: string,
    fixedId: string,
    otherField: string,
    request: PageRequestDto,
    populateSelect: string,
    exclude: string[]
  ): Promise<PageResult<TResult>> {
    const filter = {
      [fixedField]: toObjectId(fixedId),
      ...(exclude.length > 0 ? { [otherField]: { $nin: exclude.map(toObjectId) } } : {})
    } as QueryFilter<T>
    // Deactivated users populate as null; callers drop them.
    return this.paginate<TResult>(filter, request, {
      populate: { path: otherField, select: populateSelect, match: { deletedAt: null } }
    })
  }

  private async collectIds(field: string, id: string, otherField: string, candidateIds?: string[]) {
    const filter = {
      [field]: toObjectId(id),
      ...(candidateIds ? { [otherField]: { $in: candidateIds.map(toObjectId) } } : {})
    } as QueryFilter<T>
    const rows = await this.model.find(filter, otherField).lean()
    return new Set(rows.map((row) => String((row as unknown as Record<string, unknown>)[otherField])))
  }
}
