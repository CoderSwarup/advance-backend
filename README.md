# Advance Backend

Production-ready Express.js starter with TypeScript — structured logging,
centralized error handling, and observability basics built in.

- **Author:** [CoderSwarup](https://github.com/CoderSwarup)
- **Repo:**
  [github.com/CoderSwarup/advance-backend](https://github.com/CoderSwarup/advance-backend)

## Tech Stack

- **Runtime:** Node.js ≥ 20
- **Framework:** Express 5 (ESM)
- **Language:** TypeScript (strict, NodeNext)
- **Logging:** Winston (console + rotating files) → Grafana Loki
- **Metrics:** Prometheus (scrapes `/metrics`)
- **Tracing:** OpenTelemetry → Grafana Tempo
- **Package Manager:** pnpm
- **Lint:** ESLint (typescript-eslint)

## Features

- Structured JSON logging with request/response tracing and durations
- Request-ID correlation (`x-request-id`) across request, response, and error
  logs
- Slow-request detection (`LOGGING_SLOW_REQUEST_THRESHOLD_MS`)
- Centralized error handling (`HttpError` class → one error pipeline)
- Typed config (`__CONFIG__`) + typed `process.env` (`env.d.ts`)
- Health endpoint with uptime, memory, and load metrics
- Graceful shutdown (SIGTERM/SIGINT) + uncaught exception handlers
- Pre-build gate: `build` runs typecheck + lint automatically
- Optional log shipping to Grafana Loki (`LOKI_ENABLED`) with 5s batching
- Prometheus metrics at `/metrics` (request rate/duration, process stats)
- Distributed tracing via OpenTelemetry → Grafana Tempo (`TRACING_ENABLED`),
  with `trace_id` in every log line (log ↔ trace links in Grafana)
- One-command observability stack with auto-provisioned Grafana datasources and
  a home dashboard (`pnpm docker:up`)
- Production-safe responses: stack traces / IP stripped, non-operational errors
  masked

## Project Structure

```
src/
├── config/          # __CONFIG__ (env, server, logging)
├── constants/       # enums + response messages (barrel: index.ts)
├── controllers/     # route handlers (healthCheck)
├── middleware/      # requestLogger, notFoundHandler, globalErrorHandler
├── router/          # /v1 routes
├── types/           # env.d.ts (typed process.env) + express.d.ts
├── utils/           # logger, httpResponse, errorObject, HttpError
├── app.ts           # express app (middleware chain)
└── server.ts        # boot + shutdown handling

docker/
├── docker-compose.yml      # Loki + Prometheus + Tempo + Grafana
├── loki/config.yml         # custom Loki config (30-day retention)
├── prometheus/prometheus.yml  # scrape config (app + prometheus itself)
├── tempo/config.yml        # OTLP receivers + 30-day trace retention
├── grafana/provisioning/   # auto-provisioned datasources + dashboard provider
└── grafana/dashboards/     # provisioned "Advance Backend — Overview" dashboard
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

# 5. Start the dev server (hot-reload) → http://localhost:8000
pnpm dev
```

## Scripts

| Command            | Description                                       |
| ------------------ | ------------------------------------------------- |
| `pnpm dev`         | Start with hot-reload (tsx watch)                 |
| `pnpm check`       | Typecheck + lint only                             |
| `pnpm build`       | check → compile to `dist/`                        |
| `pnpm start`       | Run production build                              |
| `pnpm typecheck`   | `tsc --noEmit`                                    |
| `pnpm lint`        | ESLint                                            |
| `pnpm docker:up`   | Start Loki + Prometheus + Tempo + Grafana         |
| `pnpm docker:down` | Stop + remove containers (keep data)              |
| `pnpm docker:stop` | Stop containers (keep data)                       |
| `pnpm docker:logs` | Tail container logs                               |
| `pnpm docker:kill` | Remove containers + network + volumes (wipe data) |

## Environment Variables

| Key                                 | Default                           | Description                                                 |
| ----------------------------------- | --------------------------------- | ----------------------------------------------------------- |
| `NODE_ENV`                          | `development`                     | `development` \| `production`                               |
| `PORT`                              | `8000`                            | Server port                                                 |
| `APP_NAME`                          | `advance-backend`                 | Service name in logs                                        |
| `LOGGING_LEVEL`                     | `debug`/`info`                    | `debug` \| `info` \| `warn` \| `error`                      |
| `LOGGING_FORMAT`                    | `console`/`json`                  | `console` (pretty) \| `json` (structured)                   |
| `LOGGING_DIRECTORY`                 | `logs`                            | Log file directory                                          |
| `LOGGING_SLOW_REQUEST_THRESHOLD_MS` | `200`                             | Requests slower than this are logged as `HTTP_REQUEST_SLOW` |
| `LOGGING_RETENTION_DAYS`            | `7`                               | Daily log files kept for this many days                     |
| `LOKI_ENABLED`                      | `false`                           | Ship logs to Grafana Loki                                   |
| `LOKI_URL`                          | `http://localhost:3100`           | Loki push endpoint                                          |
| `MONITORING_ENABLED`                | `true`                            | Expose `/metrics` + collect Prometheus metrics              |
| `TRACING_ENABLED`                   | `false`                           | Export request traces to Tempo via OTLP/HTTP                |
| `TRACING_OTLP_URL`                  | `http://localhost:4318/v1/traces` | OTLP HTTP traces endpoint                                   |

## Endpoints

| Method | Path         | Description                         |
| ------ | ------------ | ----------------------------------- |
| GET    | `/`          | API alive                           |
| GET    | `/v1/health` | Health check (uptime, memory, load) |
| GET    | `/metrics`   | Prometheus metrics (if enabled)     |

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

Configured via the `LOGGING_*` env vars (validated in `__CONFIG__.logging`):

- **Format:** `console` → pretty colorized output (dev) · `json` → structured
  (production default)
- **Files:** `logs/<env>.log` + `logs/<env>-error.log` (5 MB × 5 rotations)
- **Daily rotation:** `logs/<env>-YYYY-MM-DD.log` + `-error.log` — new file
  every day, zipped when rotated, kept `LOGGING_RETENTION_DAYS` (default 7) then
  auto-deleted
- **Correlation:** every request gets an `x-request-id` (inbound header honored,
  otherwise generated UUID) — echoed in the response header and present in all
  log entries for that request
- **Slow requests:** duration ≥ `LOGGING_SLOW_REQUEST_THRESHOLD_MS` → logged as
  `HTTP_REQUEST_SLOW` (warn)
- **Loki:** `LOKI_ENABLED=true` → batches shipped to `LOKI_URL` every 5 seconds

Log events: `HTTP_REQUEST` (requestId, method, url, status, duration, slow),
`CONTROLLER_RESPONSE`, `REQUEST_ERROR` / `UNHANDLED_ERROR`, `SERVER_STARTED`,
`SERVER_SHUTDOWN`.

## Observability Stack (Loki + Prometheus + Tempo + Grafana)

```bash
pnpm docker:up   # Loki :3100 · Prometheus :9090 · Tempo :3200 · Grafana :3000 (admin/admin)
```

- **Logs:** `LOKI_ENABLED=true` → query `{app="advance-backend"}` in **Explore →
  Loki** (use **Live** for real-time tailing)
- **Metrics:** Prometheus scrapes `/metrics` every 5s — try
  `sum(rate(http_requests_total[5m]))` in **Explore → Prometheus**
- **Traces:** `TRACING_ENABLED=true` → auto-instrumented spans land in Tempo;
  every log line carries `trace_id`, so Grafana links **log → trace** and
  **trace → logs** both ways
- **Dashboard:** `docker/grafana/dashboards/advance-backend-overview.json` is
  provisioned as Grafana's home page (5s refresh) — RED metrics, process health,
  recent logs (newest first), and recent traces with click-through to the trace
  waterfall

Configs live in `docker/{loki,prometheus,tempo}/config.yml` (30-day retention);
datasources and the dashboard auto-provision from `docker/grafana/`.

## Request Flow

```
request → requestLogger → router → controller
                                    ├─ success → httpResponse → client
                                    └─ throw HttpError → globalErrorHandler
                                                          → errorObject → log → client
```

## License

[ISC](https://opensource.org/license/isc) — free to use, modify, and share (keep
the copyright notice).

---

**Happy Coding!** 🚀
