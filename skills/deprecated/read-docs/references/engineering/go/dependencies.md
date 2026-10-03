# Go Dependencies

### Config loading

**Library:** `github.com/knadh/koanf/v2`

Merges config from a YAML file and environment variables. All services use YAML as the base config and env vars as overrides.

---

### Structured logging

**Library:** `github.com/zemld/wisp`

Thin wrapper around stdlib `log/slog`. Create one logger in `app.go` and inject it into every component that needs it.

---

### Dependency injection

**Library:** `go.uber.org/fx`

Reflection-based DI container. Replaces manual wiring in `app.go` with `fx.Provide` / `fx.Invoke`. See `service-structure.md` for how it affects `app.go`.

---

### PostgreSQL

**Library:** `github.com/jackc/pgx/v5`

PostgreSQL driver. Always use `pgxpool` (connection pool), never a single connection.

#### `GO-DB-READ-01` — read source selection (`DEFAULT`)

- **Condition:** an operation reads data and can choose a primary or replica.
- **Requirement:** use the replica; use the primary only for an explicit consistency requirement such as mandatory read-after-write behavior.
- **PASS:** the read uses a replica, or the primary selection is accompanied by a stated and verified consistency guarantee.
- **FAIL:** the read uses the primary without a correctness-relevant reason.
- **N/A:** the operation writes data, does not access PostgreSQL, or cannot select a source.
- **BLOCKED:** the ticket and calling code do not establish the required consistency.
- **Exception:** a documented database or library limitation prevents replica reads.
- **Evidence:** the connection-selection call and the consistency requirement from the ticket, contract, or test.

---

### DB migrations

**Library:** `github.com/pressly/goose/v3`

Runs timestamped SQL migration files from the `migrations/` directory. Applied at startup in `app.go`.

---

### Redis

**Library:** `github.com/redis/go-redis/v9`

Redis client. Use when the service needs caching or token/session storage.

---

### REST API code generation

**Library:** `github.com/ogen-go/ogen`

Generates a fully type-safe HTTP server (router, request parsing, response encoding, validation) from `api/openapi.yaml`. Eliminates manual DTO types, `json.Decoder`/`json.Encoder` calls, and `ServeMux` wiring. The developer implements only the generated `Handler` interface — one method per OpenAPI operation. Re-run after any spec change with `go generate ./...` (or `make gen`). See `service-structure.md` for the directory layout and `generate.go` convention.

---

### Message queue

**Library:** `github.com/twmb/franz-go`

Kafka client. Use when the service needs to produce or consume Kafka messages.

---

### Agents

**Library:** `github.com/google/adk-go`

Library for building agentic systems.
