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

/** Blank values in .env (KEY=) count as unset. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional())

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
  MEDIA_PROVIDER: z.enum(['imagekit', 'local']).default('local'),
  IMAGEKIT_PUBLIC_KEY: optional(z.string()),
  IMAGEKIT_PRIVATE_KEY: optional(z.string()),
  IMAGEKIT_URL_ENDPOINT: optional(z.url()),
  /** Signs local uploads and private local URLs; only used when MEDIA_PROVIDER=local. */
  MEDIA_LOCAL_SECRET: optional(z.string().min(32)),
  MEDIA_LOCAL_DIR: z.string().default('storage/media'),
  UPLOAD_MAX_VIDEO_MB: z.coerce.number().int().positive().max(100).default(100),
  SEED_ADMIN_PASSWORD: optional(z.string()),
  SEED_USER_PASSWORD: optional(z.string())
}).superRefine((value, context) => {
  const required =
    value.MEDIA_PROVIDER === 'imagekit'
      ? (['IMAGEKIT_PUBLIC_KEY', 'IMAGEKIT_PRIVATE_KEY', 'IMAGEKIT_URL_ENDPOINT'] as const)
      : (['MEDIA_LOCAL_SECRET'] as const)
  for (const key of required) {
    if (!value[key]) context.addIssue({ code: 'custom', path: [key], message: `Required when MEDIA_PROVIDER=${value.MEDIA_PROVIDER}` })
  }
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
