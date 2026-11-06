export const ROUTES = {
  HEALTH: '/health',
  MEDIA_VIDEOS: '/media/videos',
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
    ME_PASSWORD: '/me/password'
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
    BY_ID: '/:commentId'
  },
  ADMIN_REQUESTS: {
    BASE: '/admin-requests',
    ROOT: '/',
    BY_ID: '/:requestId',
    DECISION: '/:requestId/decision'
  }
} as const
