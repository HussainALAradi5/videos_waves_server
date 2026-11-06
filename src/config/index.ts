import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config({ quiet: true })

const csv = z
  .string()
  .default('')
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGO_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  CORS_ORIGINS: csv,
  PUBLIC_BASE_URL: z.url(),
  STORAGE_VIDEOS_DIR: z.string().default('storage/videos'),
  UPLOAD_MAX_VIDEO_MB: z.coerce.number().int().positive().default(100),
  SEED_ADMIN_PASSWORD: z.string().optional(),
  SEED_USER_PASSWORD: z.string().optional()
})

export type Environment = z.infer<typeof environmentSchema>

const loadEnvironment = (): Environment => {
  const parsed = environmentSchema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`Invalid environment configuration: ${issues}`)
  }
  return parsed.data
}

export const env = loadEnvironment()
export const isProduction = env.NODE_ENV === 'production'
