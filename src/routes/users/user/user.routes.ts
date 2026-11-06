import * as followRequestController from '../../../controllers/users/follow-request/follow-request.controller'
import { Router } from 'express'
import { ROUTES } from '../../../constants/common/routes.constants'
import { Role } from '../../../enums/users/roles/role.enum'
import * as userController from '../../../controllers/users/user/user.controller'
import * as profileController from '../../../controllers/users/profile/profile.controller'
import * as followController from '../../../controllers/users/follow/follow.controller'
import * as blockController from '../../../controllers/users/block/block.controller'
import * as restrictionController from '../../../controllers/users/restriction/restriction.controller'
import * as settingsController from '../../../controllers/users/settings/settings.controller'
import * as userRoleController from '../../../controllers/users/user-role/user-role.controller'
import * as accountStatusController from '../../../controllers/users/account-status/account-status.controller'
import * as userTransferController from '../../../controllers/users/user-transfer/user-transfer.controller'
import { importUsersSchema } from '../../../dtos/users/user/import-users.dto'
import { updateUserRoleSchema } from '../../../dtos/users/user-role/update-user-role.dto'
import { updateAccountStatusSchema } from '../../../dtos/users/account-status/update-account-status.dto'
import { updateSettingsSchema } from '../../../dtos/users/settings/update-settings.dto'
import { updateProfileSchema } from '../../../dtos/users/user/update-profile.dto'
import { changePasswordSchema } from '../../../dtos/users/user/change-password.dto'
import { updateAvatarSchema } from '../../../dtos/users/user/update-avatar.dto'
import { userQuerySchema } from '../../../dtos/users/user/user-query.dto'
import { userSearchQuerySchema } from '../../../dtos/users/user/user-search-query.dto'
import { userNameParamsSchema } from '../../../dtos/users/user/user-name-params.dto'
import { relationQuerySchema } from '../../../dtos/users/follow/relation-query.dto'
import { authenticate, optionalAuthenticate } from '../../../middlewares/auth/authenticate.middleware'
import { authorize } from '../../../middlewares/auth/authorize.middleware'
import { validate } from '../../../middlewares/request/validate.middleware'
import { authRateLimit } from '../../../middlewares/security/rate-limit.middleware'

const U = ROUTES.USERS
const byUserName = validate({ params: userNameParamsSchema })
const relationPage = validate({ params: userNameParamsSchema, query: relationQuerySchema })
const myRelationPage = validate({ query: relationQuerySchema })

export const userRoutes = Router()

// Fixed paths first, so `/me` and `/search` are never read as a username (both are reserved names).
userRoutes.get(U.ROOT, authenticate, authorize(Role.ADMIN), validate({ query: userQuerySchema }), userController.listUsers)
// Registered before /:userName so these paths are never read as usernames.
userRoutes.get(U.EXPORT, authenticate, authorize(Role.ADMIN), validate({ query: userQuerySchema }), userTransferController.exportUsers)
userRoutes.post(U.IMPORT, authenticate, authorize(Role.ADMIN), validate({ body: importUsersSchema }), userTransferController.importUsers)
userRoutes.get(U.SEARCH, optionalAuthenticate, validate({ query: userSearchQuerySchema }), profileController.searchUsers)
userRoutes.get(U.ME, authenticate, userController.getMe)
userRoutes.patch(U.ME, authenticate, validate({ body: updateProfileSchema }), userController.updateMe)
userRoutes.delete(U.ME, authenticate, userController.deactivateMe)
userRoutes.patch(U.ME_AVATAR, authenticate, validate({ body: updateAvatarSchema }), userController.updateMyAvatar)
userRoutes.patch(
  U.ME_PASSWORD,
  authenticate,
  authRateLimit,
  validate({ body: changePasswordSchema }),
  userController.changeMyPassword
)
userRoutes.get(U.ME_SETTINGS, authenticate, settingsController.getMySettings)
userRoutes.patch(U.ME_SETTINGS, authenticate, validate({ body: updateSettingsSchema }), settingsController.updateMySettings)
userRoutes.get(U.ME_BLOCKED, authenticate, myRelationPage, blockController.listBlockedUsers)
userRoutes.get(U.ME_RESTRICTED, authenticate, myRelationPage, restrictionController.listRestrictedUsers)
userRoutes.get(U.ME_FOLLOW_REQUESTS, authenticate, myRelationPage, followRequestController.listFollowRequests)
userRoutes.put(U.ME_FOLLOW_REQUEST, authenticate, byUserName, followRequestController.acceptFollowRequest)
userRoutes.delete(U.ME_FOLLOW_REQUEST, authenticate, byUserName, followRequestController.declineFollowRequest)

userRoutes.get(U.PROFILE, optionalAuthenticate, byUserName, profileController.getProfile)
userRoutes.get(U.FOLLOWERS, optionalAuthenticate, relationPage, followController.listFollowers)
userRoutes.get(U.FOLLOWING, optionalAuthenticate, relationPage, followController.listFollowing)
userRoutes.put(U.FOLLOW, authenticate, byUserName, followController.followUser)
userRoutes.delete(U.FOLLOW, authenticate, byUserName, followController.unfollowUser)
userRoutes.put(U.BLOCK, authenticate, byUserName, blockController.blockUser)
userRoutes.delete(U.BLOCK, authenticate, byUserName, blockController.unblockUser)
userRoutes.put(U.RESTRICT, authenticate, byUserName, restrictionController.restrictUser)
userRoutes.delete(U.RESTRICT, authenticate, byUserName, restrictionController.unrestrictUser)
userRoutes.patch(
  U.STATUS,
  authenticate,
  authorize(Role.ADMIN),
  validate({ params: userNameParamsSchema, body: updateAccountStatusSchema }),
  accountStatusController.setAccountStatus
)
userRoutes.patch(
  U.ROLE,
  authenticate,
  authorize(Role.ADMIN),
  validate({ params: userNameParamsSchema, body: updateUserRoleSchema }),
  userRoleController.setUserRole
)
