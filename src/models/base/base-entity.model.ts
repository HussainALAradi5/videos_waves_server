import { Schema, type SchemaDefinition } from 'mongoose'
import { generateCode } from '../../utilities/codes/code-generator.utility'
import type { BaseEntityPluginOptions } from '../../interfaces/models/base/base-entity-plugin-options.interface'

/**
 * The base entity every persisted model inherits: a unique `code`, audit fields (`createdBy`,
 * `updatedBy`, set by the base repository from the signed-in user), soft delete, and timestamps
 * (`createdAt`, `updatedAt`). `_id` is MongoDB's primary key.
 */
export const buildBaseEntityDefinition = (codePrefix: string): SchemaDefinition => ({
  code: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
    default: () => generateCode(codePrefix)
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null, immutable: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  deletedAt: { type: Date, default: null, index: true },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
})

/** Mongoose's inheritance mechanism: applying this plugin makes a schema extend the base entity. */
export const baseEntityPlugin = (schema: Schema, options: BaseEntityPluginOptions): void => {
  schema.add(buildBaseEntityDefinition(options.codePrefix))
  schema.set('timestamps', true)
}
