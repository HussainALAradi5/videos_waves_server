export const ROUTES = {
  HEALTH: '/health',
  MEDIA: {
    BASE: '/media',
    ROOT: '/',
    SIGNATURE: '/signature',
    BY_ID: '/:mediaId',
    LOCAL_UPLOAD: '/local-upload',
    LOCAL_FILES: '/files'
  },
  AUTH: {
    BASE: '/auth',
    REGISTER: '/register',
    LOGIN: '/login',
    REFRESH: '/refresh',
    LOGOUT: '/logout'
  },
  USERS: {
    BASE: '/users',
    ROOT: '/',
    ME: '/me',
    ME_PASSWORD: '/me/password',
    ME_AVATAR: '/me/avatar',
    ME_BLOCKED: '/me/blocked',
    ME_RESTRICTED: '/me/restricted',
    SEARCH: '/search',
    PROFILE: '/:userName',
    FOLLOW: '/:userName/follow',
    FOLLOWERS: '/:userName/followers',
    FOLLOWING: '/:userName/following',
    BLOCK: '/:userName/block',
    RESTRICT: '/:userName/restrict'
  },
  VIDEOS: {
    BASE: '/videos',
    ROOT: '/',
    BY_ID: '/:videoId',
    VIEWS: '/:videoId/views',
    LIKE: '/:videoId/like'
  },
  COMMENTS: {
    BASE: '/videos/:videoId/comments',
    ROOT: '/',
    BY_ID: '/:commentId',
    REPLIES: '/:commentId/replies',
    RESTORE: '/:commentId/restore',
    APPROVE: '/:commentId/approve'
  },
  CHAT: {
    BASE: '/chat',
    UNREAD: '/unread-count',
    CONVERSATIONS: '/conversations',
    GROUPS: '/groups',
    CONVERSATION: '/conversations/:conversationId',
    ACCEPT: '/conversations/:conversationId/accept',
    READ: '/conversations/:conversationId/read',
    MEMBERS: '/conversations/:conversationId/members',
    MEMBER: '/conversations/:conversationId/members/:userId',
    MESSAGES: '/conversations/:conversationId/messages',
    MESSAGE: '/conversations/:conversationId/messages/:messageId',
    REACTION: '/conversations/:conversationId/messages/:messageId/reaction'
  },
  ADMIN_REQUESTS: {
    BASE: '/admin-requests',
    ROOT: '/',
    BY_ID: '/:requestId',
    DECISION: '/:requestId/decision'
  }
} as const
