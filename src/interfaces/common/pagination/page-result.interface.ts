import type { PageMeta } from './page-meta.interface'

export interface PageResult<T> {
  items: T[]
  meta: PageMeta
}
