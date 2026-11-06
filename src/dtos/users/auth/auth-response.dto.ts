import type { UserResponseDto } from '../user/user-response.dto'

export interface AuthTokensDto {
  accessToken: string
  refreshToken: string
}

export interface AuthResponseDto extends AuthTokensDto {
  user: UserResponseDto
}
