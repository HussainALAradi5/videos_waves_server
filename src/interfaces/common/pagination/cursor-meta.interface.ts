/** Metadata for cursor ("load older") pages, used where items arrive live and offsets would shift. */
export interface CursorMeta {
  pageSize: number
  /** Pass as `before` to load the next (older) page; null when there is nothing older. */
  nextCursor: string | null
  hasMore: boolean
}
