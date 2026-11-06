import type { Gender } from '../../../enums/users/user/gender.enum'

export interface PublicUserResponseDto {
  id: string
  userName: string
  /** null means: show the standard avatar for `gender`. */
  avatarUrl: string | null
  gender: Gender | null
}
