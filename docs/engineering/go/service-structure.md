```
<service>/
├── api/                        # API specs (openapi.yaml)
├── cmd/main.go                 # Entry point — calls into internal/app, no logic
├── config/                     # Static config files (config.yaml)
├── deploy/                     # Dockerfile and deployment assets
├── generated/                  # Generated code (protobuf, grpc) — never edit by hand
├── migrations/                 # SQL migrations, timestamped
├── internal/
│   ├── adapters/               # Concrete I/O implementations only (no interfaces here)
│   │   ├── clients/
│   │   │   └── <name>/         # One directory per outbound client
│   │   │       └── <impl>/     # Concrete implementation (e.g. aistudio/, http/)
│   │   └── repository/
│   │       └── <name>/         # One directory per persistence scope
│   │           └── <impl>/     # Concrete implementation (e.g. postgres/, ydb/)
│   ├── api/                    # Inbound transport handlers
│   │   ├── grpc/
│   │   │   ├── convert/
│   │   │   ├── handler/
│   │   │   └── server/
│   │   └── rest/
│   │       ├── convert/
│   │       ├── dto/
│   │       ├── handler/
│   │       └── server/
│   ├── app/
│   │   └── app.go              # Composition root — wires everything, only place with concrete types
│   ├── config/
│   │   ├── load.go
│   │   └── types.go
│   ├── domain/                 # Domain models + incoming service interfaces
│   │   ├── <bounded_context>/
│   │   │   ├── service.go      # Incoming service interface (contract for callers)
│   │   │   └── entities/       # Business entities, value objects, invariants
│   │   └── shared/             # Models used across multiple bounded contexts
│   ├── ports/                  # Outgoing port interfaces (what services need from I/O)
│   │   ├── clients/
│   │   │   └── <name>.go
│   │   └── repository/
│   │       └── <name>.go
│   ├── services/               # Business logic implementations
│   │   └── <name>/
│   │       ├── service.go          # Struct + constructor only
│   │       ├── <operation>.go      # One public method per file
│   │       └── <operation>_test.go
│   └── utils/                  # Generic, domain-free helpers (last resort)
├── go.mod
├── Makefile
├── .golangci.yml
└── .mockery.yml
```
