```
<project>/
├── backend/
│   ├── schemas/
│   │   └── proto/
│   │       └── <service>/
│   │           └── v1/                   # Version directory is mandatory
│   │               ├── <service>.proto   # RPC definitions
│   │               └── models/           # Shared message types
│   └── services/
│       └── <go-service>/                 # See docs/engineering/go/service-structure.md
├── frontend/                 # See docs/engineering/frontend/project-structure.md
└── infra/
    ├── testing/
    │   ├── docker-compose.yaml   # Full local dev stack
    │   ├── .env.example          # Committed; documents all required variables
    │   └── .env                  # Not committed
    └── production/
        ├── k8s/                  # Flat directory; manifests named <service>-<kind>.yaml
        ├── kind/                 # kind cluster definition for local k8s testing
        │   └── cluster.yaml
        └── nginx/
            └── <project>.conf
```
