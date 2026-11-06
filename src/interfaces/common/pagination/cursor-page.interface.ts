import type { CursorMeta } from './cursor-meta.interface'

export interface CursorPage<T> {
  items: T[]
  meta: CursorMeta
}
