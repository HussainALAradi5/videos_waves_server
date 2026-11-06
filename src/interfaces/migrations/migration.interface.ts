/** One ordered, idempotent schema or data change. `id` is stored once it has run. */
export interface Migration {
  id: string
  description: string
  up(): Promise<void>
}
