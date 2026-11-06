import { Schema } from 'mongoose'
import { generateCode } from '../../utilities/codes/code-generator.utility'

export interface BaseEntityPluginOptions {
  codePrefix: string
}

// Adds the shared base entity fields (code, audit, soft delete) to every persisted schema.
export const baseEntityPlugin = (schema: Schema, options: BaseEntityPluginOptions): void => {
  schema.add({
    code: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      default: () => generateCode(options.codePrefix)
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null, immutable: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  })
  schema.set('timestamps', true)
}
