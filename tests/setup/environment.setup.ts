import { tmpdir } from 'os'
import path from 'path'

// Runs before any test imports the config loader.
process.env.NODE_ENV = 'test'
process.env.MONGO_URI ??= 'mongodb://placeholder-replaced-by-memory-server'
process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-long-enough-123456'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-long-enough-654321'
process.env.BCRYPT_SALT_ROUNDS = '10'
process.env.CORS_ORIGINS = 'http://localhost:3000'
process.env.PUBLIC_BASE_URL = 'http://localhost:5000'
process.env.MEDIA_PROVIDER = 'local'
process.env.MEDIA_LOCAL_DIR = path.join(tmpdir(), 'videos-waves-test-media')
process.env.MEDIA_LOCAL_SECRET = 'test-media-secret-'.padEnd(64, 'x')
process.env.UPLOAD_MAX_VIDEO_MB = '1'
