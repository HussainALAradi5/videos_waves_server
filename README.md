# Videos Waves — Server

REST API for Videos Waves, a short-video sharing app: accounts, video upload and streaming, likes, comments, and admin promotion requests.

**Stack:** Node.js 20+, Express 5, TypeScript, MongoDB (Mongoose 9), Zod 4, JWT access and refresh tokens, Multer uploads, Vitest + Supertest.

Related repositories: [web client](../videos_waves_client) · [mobile app](../videos_waves_mobile) · [documentation](../videos_waves_documentation)

## Quick start

```bash
npm install
cp .env.example .env        # then set the two JWT secrets
npm run dev                 # needs a MongoDB at MONGO_URI
```

No MongoDB installed? `npm run dev:memory` starts an in-memory database, seeds one user per role, and serves the API on `PORT`. Its data is lost on exit. The seeded credentials are written to `.seed-credentials.local.json`, which git ignores.

| Script | What it does |
| --- | --- |
| `npm run dev` | Watch mode against `MONGO_URI` |
| `npm run dev:memory` | In-memory MongoDB with seed users (development only) |
| `npm run seed` | Creates the admin and viewer accounts if they are missing (refuses to run in production) |
| `npm run build` | Compiles to `dist/` |
| `npm start` | Runs `dist/server.js` |
| `npm run typecheck` | Type-checks source, tests, and scripts |
| `npm test` | Unit and HTTP tests on an in-memory MongoDB |

## Environment

All values are validated at startup; the server refuses to start when a required value is missing or invalid. See [.env.example](.env.example).

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Separate signing secrets, at least 32 characters |
| `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | Token lifetimes (default `15m` and `7d`) |
| `CORS_ORIGINS` | Comma-separated browser origins allowed to call the API |
| `PUBLIC_BASE_URL` | Origin used to build `videoUrl` values |
| `STORAGE_VIDEOS_DIR`, `UPLOAD_MAX_VIDEO_MB` | Upload folder and size limit |
| `SEED_ADMIN_PASSWORD`, `SEED_USER_PASSWORD` | Optional fixed seed passwords |

## Layout

Layer-first: each layer has the same `users/...` and `videos/...` subfolders.

```text
src/
  config/        env loader, database, auth, security, storage
  constants/     messages, limits, routes, regex, per-domain values
  enums/         roles, admin request status, error codes, sort direction
  globals/       Express request typing
  models/        Mongoose schemas + base entity plugin
  interfaces/    model, auth, request, and pagination types
  dtos/          Zod request schemas and response DTOs
  validations/   reusable schemas and rules (ids, pagination, ownership, files)
  repositories/  base repository (audit, soft delete, pagination) + one per model
  services/      business rules, no HTTP objects
  mappers/       model -> response DTO
  controllers/   thin HTTP handlers
  routes/        route wiring and middleware order
  middlewares/   auth, validation, errors, logging, rate limits, headers, uploads
  utilities/     responses, errors, pagination, codes, passwords, media URLs
  seeds/         development seed, one user per role
tests/           mirrors src/
```

## API summary

Every response uses one envelope: `{ success: true, data, meta? }` or `{ success: false, error: { code, message, details?, requestId } }`. List endpoints accept `page`, `pageSize` (max 50), `sortBy` (from an allowlist), and `sortDirection`.

| Method | Path | Access |
| --- | --- | --- |
| POST | `/auth/register`, `/auth/login`, `/auth/refresh` | Public (rate-limited) |
| POST | `/auth/logout` | Signed in |
| GET, PATCH, DELETE | `/users/me` | Signed in |
| PATCH | `/users/me/password` | Signed in |
| GET | `/users` | Admin |
| GET | `/videos`, `/videos/:videoId` | Public (`isLiked` when signed in) |
| POST | `/videos` (multipart `file`, `title`, `description`) | Signed in |
| PATCH, DELETE | `/videos/:videoId` | Owner or admin |
| POST | `/videos/:videoId/views` | Public |
| PUT, DELETE | `/videos/:videoId/like` | Signed in |
| GET | `/videos/:videoId/comments` | Public |
| POST | `/videos/:videoId/comments` | Signed in |
| PATCH | `/videos/:videoId/comments/:commentId` | Author |
| DELETE | `/videos/:videoId/comments/:commentId` | Author or admin |
| POST, GET | `/admin-requests` | Signed in (users see their own) |
| GET, DELETE | `/admin-requests/:requestId` | Requester (admins can read) |
| PATCH | `/admin-requests/:requestId/decision` | Admin |
| GET | `/media/videos/:fileName` | Public, active videos only |
| GET | `/health` | Public |

Full service, controller, and use-case documentation lives in the [documentation repository](../videos_waves_documentation).
