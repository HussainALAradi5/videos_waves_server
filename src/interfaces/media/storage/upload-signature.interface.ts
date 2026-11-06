/** What a client needs to upload one file straight to the storage provider. */
export interface UploadSignature {
  token: string
  expire: number
  signature: string
}
