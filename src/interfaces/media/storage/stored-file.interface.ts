/** Provider-neutral view of an uploaded file, read back from the provider before we trust it. */
export interface StoredFile {
  fileId: string
  filePath: string
  url: string
  mimeType: string
  sizeBytes: number
  isPrivate: boolean
  width: number | null
  height: number | null
  durationSeconds: number | null
}
