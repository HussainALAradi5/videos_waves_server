import type { MediaProvider } from '../../../enums/media/media/media-provider.enum'

/** Everything a client sends to the provider's upload endpoint, plus the rules it should check first. */
export interface UploadSignatureResponseDto {
  provider: MediaProvider
  uploadUrl: string
  publicKey: string
  token: string
  expire: number
  signature: string
  folder: string
  isPrivateFile: boolean
  maxBytes: number
  mimeTypes: readonly string[]
}
