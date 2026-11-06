/** Fields every entity response shares, mirroring the base entity (audit ids stay server-side). */
export interface BaseEntityResponseDto {
  id: string
  code: string
  createdAt: string
}
