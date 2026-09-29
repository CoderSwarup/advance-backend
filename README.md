# Advance Backend

Production-ready Express.js starter with TypeScript — structured logging,
centralized error handling, and observability basics built in.

**Author:** [CoderSwarup](https://github.com/CoderSwarup)
**Repo:** [github.com/CoderSwarup/advance-backend](https://github.com/CoderSwarup/advance-backend)

## Tech Stack

- **Runtime:** Node.js ≥ 20
- **Framework:** Express 5 (ESM)
- **Language:** TypeScript (strict, NodeNext)
- **Logging:** Winston (console + rotating files)
- **Package Manager:** pnpm
- **Lint:** ESLint (typescript-eslint)

## Features

- Structured JSON logging with request/response tracing and durations
- Centralized error handling (`HttpError` class → one error pipeline)
- Typed config (`__CONFIG__`) + typed `process.env` (`env.d.ts`)
- Health endpoint with uptime, memory, and load metrics
- Graceful shutdown (SIGTERM/SIGINT) + uncaught exception handlers
- Pre-build gate: `build` runs typecheck + lint automatically
- Production-safe responses: stack traces / IP stripped, non-operational errors
  masked

## Project Structure

```
src/
├── config/          # __CONFIG__ (env, server, logging)
├── constants/       # enums + response messages (barrel: index.ts)
├── controllers/     # route handlers (healthCheck)
├── middleware/       # requestLogger, notFoundHandler, globalErrorHandler
├── router/          # /v1 routes
├── utils/           # logger, httpResponse, errorObject, HttpError
├── app.ts           # express app (middleware chain)
├── server.ts        # boot + shutdown handling
└── env.d.ts         # typed process.env
```

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/CoderSwarup/advance-backend.git

# 2. Enter the project folder
cd advance-backend

# 3. Install all dependencies
pnpm install

# 4. Create your local environment file
cp .env.example .env

# 5. Start the dev server (hot-reload) → http://localhost:3000
pnpm dev
```

## Scripts

| Command          | Description                       |
| ---------------- | --------------------------------- |
| `pnpm dev`       | Start with hot-reload (tsx watch) |
| `pnpm check`     | Typecheck + lint only             |
| `pnpm build`     | check → compile to `dist/`        |
| `pnpm start`     | Run production build              |
| `pnpm typecheck` | `tsc --noEmit`                    |
| `pnpm lint`      | ESLint                            |

## Environment Variables

| Key         | Default           | Description                            |
| ----------- | ----------------- | -------------------------------------- |
| `NODE_ENV`  | `development`     | `development` \| `production`          |
| `PORT`      | `3000`            | Server port                            |
| `APP_NAME`  | `advance-backend` | Service name in logs                   |
| `LOG_LEVEL` | `debug`/`info`    | `debug` \| `info` \| `warn` \| `error` |

## Endpoints

| Method | Path         | Description                         |
| ------ | ------------ | ----------------------------------- |
| GET    | `/`          | API alive                           |
| GET    | `/v1/health` | Health check (uptime, memory, load) |

**Success response**

```json
{
  "success": true,
  "statusCode": 200,
  "request": { "method": "GET", "url": "/v1/health" },
  "message": "Success",
  "data": { "status": "UP", "uptime": 12.34 }
}
```

**Error response**

```json
{
  "success": false,
  "statusCode": 404,
  "request": { "method": "GET", "url": "/missing" },
  "message": "Resource not found: GET /missing",
  "data": null,
  "trace": { "error": "HttpError: ..." }
}
```

> In production `trace` and `request.ip` are removed; non-operational errors
> show only `"Something went wrong"`.

## Logging

- **Development:** pretty, colorized console
- **Production:** JSON to console
- **Files:** `logs/<env>.log` + `logs/<env>-error.log` (5 MB × 5 rotations)

Log events: `HTTP_REQUEST` (method, url, status, duration),
`CONTROLLER_RESPONSE`, `REQUEST_ERROR` / `UNHANDLED_ERROR`, `SERVER_STARTED`,
`SERVER_SHUTDOWN`.

## Request Flow

```
request → requestLogger → router → controller
                                    ├─ success → httpResponse → client
                                    └─ throw HttpError → globalErrorHandler
                                                          → errorObject → log → client
```

## License

[ISC](https://opensource.org/license/isc) — free to use, modify, and share (keep the copyright notice).

---

**Happy Coding!** 🚀
