#!/usr/bin/env python3
"""Scaffold a new Go microservice following the canonical project layout.

Usage:
    python scaffold.py --name user-service \
                       --module github.com/org/project/user-service \
                       --out backend/services/user-service \
                       --transport both \
                       --go-version 1.25.8
"""

import argparse
import os
import sys

_REFERENCES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "references")


# ── Helpers ────────────────────────────────────────────────────────────────────

def pascal_case(kebab: str) -> str:
    return "".join(p.capitalize() for p in kebab.split("-"))


def snake_case(kebab: str) -> str:
    return kebab.replace("-", "_")


def render(template: str, **subs: str) -> str:
    result = template
    for key, value in subs.items():
        result = result.replace(f"__{key.upper()}__", value)
    return result


def write_file(base: str, rel_path: str, content: str) -> None:
    full = os.path.join(base, rel_path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(content)
    print(f"  {rel_path}")


def copy_ref(base: str, ref_name: str, dest_rel_path: str, **subs: str) -> None:
    """Read a file from references/, optionally substitute markers, write to dest."""
    src = os.path.join(_REFERENCES_DIR, ref_name)
    with open(src) as f:
        content = f.read()
    if subs:
        content = render(content, **subs)
    write_file(base, dest_rel_path, content)


def gitkeep(base: str, rel_dir: str) -> None:
    write_file(base, os.path.join(rel_dir, ".gitkeep"), "")


# ── File templates ─────────────────────────────────────────────────────────────
# Substitution markers: __MODULE__ __NAME__ __PASCAL__ __SNAKE__ __GO_VERSION__

TOOL_VERSIONS = """\
golang __GO_VERSION__
"""

GO_MOD = """\
module __MODULE__

go __GO_VERSION__
"""

MAKEFILE = """\
GO_BIN := $(shell dirname $(shell go env GOPATH))/bin
export PATH := $(GO_BIN):$(PATH)

.PHONY: lint test test-cover test-race format build gen

lint:
\tgolangci-lint run ./...

test:
\tgo test ./...

test-cover:
\tgo test ./... -cover

test-race:
\tgo test ./... -race

format:
\tgolangci-lint run --fix ./...

build:
\tgo build ./...

gen:
\tgo generate ./...
"""


# cmd/main.go without a //go:generate directive (gRPC-only or no transport)
CMD_MAIN = """\
package main

import "__MODULE__/internal/app"

func main() {
\tapp.New().Run()
}
"""

# Paths in //go:generate are relative to the cmd/ directory.
CMD_MAIN_REST = """\
package main

//go:generate go run github.com/ogen-go/ogen/cmd/ogen --target ../internal/api/rest/ogen --package ogen --clean ../api/openapi.yaml

import "__MODULE__/internal/app"

func main() {
\tapp.New().Run()
}
"""

CONFIG_YAML = """\
environment: development

database:
  host: localhost
  port: 5432
  user: changeme
  password: changeme
  database: __SNAKE__
  sslmode: disable

http_server_port: 8080
grpc_server_port: 50051
"""

DOCKERFILE = """\
FROM golang:__GO_VERSION__-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server ./cmd/main.go

FROM alpine:3.21
WORKDIR /app
COPY --from=builder /app/server .
COPY config/config.yaml ./config/config.yaml
EXPOSE 8080 50051
CMD ["./server"]
"""

CONFIG_TYPES = """\
package config

import "fmt"

type Config struct {
\tEnvironment    string         `koanf:"environment"`
\tHTTPServerPort int            `koanf:"http_server_port"`
\tGRPCServerPort int            `koanf:"grpc_server_port"`
\tDatabase       DatabaseConfig `koanf:"database"`
}

type DatabaseConfig struct {
\tHost     string `koanf:"host"`
\tPort     int    `koanf:"port"`
\tUser     string `koanf:"user"`
\tPassword string `koanf:"password"`
\tDatabase string `koanf:"database"`
\tSSLMode  string `koanf:"sslmode"`
}

func (c *DatabaseConfig) URL() string {
\treturn fmt.Sprintf(
\t\t"postgres://%s:%s@%s:%d/%s?sslmode=%s",
\t\tc.User, c.Password, c.Host, c.Port, c.Database, c.SSLMode,
\t)
}
"""

CONFIG_LOAD = """\
package config

import (
\t"fmt"
\t"strings"

\t"github.com/knadh/koanf/parsers/yaml"
\t"github.com/knadh/koanf/providers/env"
\t"github.com/knadh/koanf/providers/file"
\t"github.com/knadh/koanf/v2"
)

func Load() (*Config, error) {
\tk := koanf.New(".")

\tif err := k.Load(file.Provider("config/config.yaml"), yaml.Parser()); err != nil {
\t\treturn nil, fmt.Errorf("load config file: %w", err)
\t}

\tif err := k.Load(env.Provider("", ".", func(s string) string {
\t\treturn strings.ReplaceAll(strings.ToLower(s), "_", ".")
\t}), nil); err != nil {
\t\treturn nil, fmt.Errorf("load env: %w", err)
\t}

\tvar cfg Config
\tif err := k.Unmarshal("", &cfg); err != nil {
\t\treturn nil, fmt.Errorf("unmarshal config: %w", err)
\t}

\treturn &cfg, nil
}
"""

APP_GO = """\
package app

import (
\t"go.uber.org/fx"

\texamplepostgres "__MODULE__/internal/adapters/repository/example/postgres"
\texamplesvc "__MODULE__/internal/services/example"
\t"__MODULE__/internal/config"
)

func New() *fx.App {
\treturn fx.New(
\t\tfx.Provide(config.Load),
\t\tfx.Provide(examplepostgres.New),
\t\tfx.Provide(examplesvc.NewService),
\t)
}
"""

DOMAIN_ERRORS = """\
package domain

import "errors"

var ErrNotFound = errors.New("not found")
"""

DOMAIN_SVC = """\
package example

import "context"

type Service interface {
\tPing(ctx context.Context) error
}
"""

SVC_SERVICE = """\
package example

import (
\tdomain "__MODULE__/internal/domain/example"
\t"__MODULE__/internal/ports/repository"
)

var _ domain.Service = (*ExampleService)(nil)

type ExampleService struct {
\trepo repository.Getter
}

func NewService(repo repository.Getter) *ExampleService {
\treturn &ExampleService{repo: repo}
}
"""

SVC_PING = """\
package example

import "context"

func (s *ExampleService) Ping(_ context.Context) error {
\treturn nil
}
"""

UTILS_POSTGRES = """\
package postgres

import (
\t"context"
\t"fmt"
\t"math"
\t"time"

\t"github.com/jackc/pgx/v5/pgxpool"
)

const (
\t_maxRetries    = 5
\t_baseDelay     = time.Second
\t_backoffFactor = 2
)

func Connect(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
\tvar (
\t\tpool *pgxpool.Pool
\t\terr  error
\t)

\tfor i := 1; i <= _maxRetries; i++ {
\t\tpool, err = pgxpool.New(ctx, databaseURL)
\t\tif err == nil {
\t\t\tif pingErr := pool.Ping(ctx); pingErr == nil {
\t\t\t\treturn pool, nil
\t\t\t}

\t\t\tpool.Close()
\t\t}

\t\tdelay := time.Duration(math.Pow(_backoffFactor, float64(i))) * _baseDelay

\t\ttime.Sleep(delay)
\t}

\treturn nil, fmt.Errorf("connect to database: %w", err)
}
"""

PORTS_REPO = """\
package repository

import "context"

type Getter interface {
\tGet(ctx context.Context, id string) (string, error)
}

type Repository interface {
\tGetter
}
"""

REPO_POSTGRES = """\
package postgres

import (
\t"context"
\t"fmt"
\t"time"

\t"github.com/jackc/pgx/v5/pgxpool"

\t"__MODULE__/internal/config"
\t"__MODULE__/internal/ports/repository"
\tutilspostgres "__MODULE__/internal/utils/postgres"
)

const _connectTimeout = 10 * time.Second

var _ repository.Getter = (*Repository)(nil)

type Repository struct {
\tpool *pgxpool.Pool
}

func New(cfg *config.Config) (repository.Getter, error) {
\tctx, cancel := context.WithTimeout(context.Background(), _connectTimeout)
\tdefer cancel()

\tpool, err := utilspostgres.Connect(ctx, cfg.Database.URL())
\tif err != nil {
\t\treturn nil, fmt.Errorf("connect: %w", err)
\t}

\treturn &Repository{pool: pool}, nil
}

func (r *Repository) Get(_ context.Context, _ string) (string, error) {
\treturn "", nil
}
"""

REST_HANDLER = """\
package handler
"""

REST_CONVERT = """\
package convert
"""

REST_SERVER = """\
package server

import (
\t"fmt"
\t"net/http"
\t"strconv"
)

type Server struct {
\thttpServer *http.Server
}

func New(port int, handler http.Handler) *Server {
\treturn &Server{
\t\thttpServer: &http.Server{
\t\t\tAddr:    ":" + strconv.Itoa(port),
\t\t\tHandler: handler,
\t\t},
\t}
}

func (s *Server) Start() error {
\tif err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
\t\treturn fmt.Errorf("listen and serve: %w", err)
\t}

\treturn nil
}
"""

OPENAPI_YAML = """\
openapi: "3.0.3"
info:
  title: __NAME__
  version: "1.0.0"
paths:
  /ping:
    get:
      operationId: ping
      summary: Health check
      responses:
        "200":
          description: OK
"""


GRPC_HANDLER = """\
package handler
"""

GRPC_CONVERT = """\
package convert
"""

GRPC_SERVER = """\
package server

import (
\t"fmt"
\t"net"

\t"google.golang.org/grpc"
)

type Server struct {
\tgrpc *grpc.Server
\tport int
}

func New(port int) *Server {
\treturn &Server{
\t\tgrpc: grpc.NewServer(),
\t\tport: port,
\t}
}

func (s *Server) Start() error {
\tlis, err := net.Listen("tcp", fmt.Sprintf(":%d", s.port))
\tif err != nil {
\t\treturn fmt.Errorf("listen: %w", err)
\t}

\tif err = s.grpc.Serve(lis); err != nil {
\t\treturn fmt.Errorf("serve: %w", err)
\t}

\treturn nil
}
"""


# ── Main ───────────────────────────────────────────────────────────────────────

def scaffold(name: str, module: str, out: str, transport: str, go_version: str) -> None:
    pascal = pascal_case(name)
    snake = snake_case(name)

    def t(tmpl: str) -> str:
        return render(tmpl, module=module, name=name, pascal=pascal, snake=snake, go_version=go_version)

    def w(path: str, tmpl: str) -> None:
        write_file(out, path, t(tmpl))

    print(f"\nScaffolding '{name}' → {out}/\n")

    # Core
    w(".tool-versions",             TOOL_VERSIONS)
    w("go.mod",                     GO_MOD)
    w("Makefile",                   MAKEFILE)
    copy_ref(out, ".golangci.yml", ".golangci.yml", go_version=go_version)
    copy_ref(out, ".mockery.yml",  ".mockery.yml")
    # Use REST variant of main.go when REST is included — it embeds the //go:generate directive.
    w("cmd/main.go",                CMD_MAIN_REST if transport in ("rest", "both") else CMD_MAIN)
    w("config/config.yaml",         CONFIG_YAML)
    w("deploy/Dockerfile",          DOCKERFILE)
    w("internal/app/app.go",        APP_GO)
    w("internal/config/types.go",   CONFIG_TYPES)
    w("internal/config/load.go",    CONFIG_LOAD)
    w("internal/domain/errors.go",  DOMAIN_ERRORS)
    gitkeep(out, "migrations")

    # Domain service interface + bounded context layout
    w("internal/domain/example/service.go", DOMAIN_SVC)
    gitkeep(out, "internal/domain/example/entities")
    gitkeep(out, "internal/domain/shared")

    # Service implementation
    w("internal/services/example/service.go", SVC_SERVICE)
    w("internal/services/example/ping.go",    SVC_PING)

    # Utils
    w("internal/utils/postgres/connect.go", UTILS_POSTGRES)

    # Port interfaces
    w("internal/ports/repository/example.go", PORTS_REPO)
    gitkeep(out, "internal/ports/clients")

    # Adapter skeleton
    gitkeep(out, "internal/adapters/clients")

    # Repository skeleton (implementation only — no interfaces here)
    w("internal/adapters/repository/example/postgres/repository.go", REPO_POSTGRES)

    # REST
    if transport in ("rest", "both"):
        w("api/openapi.yaml",                     OPENAPI_YAML)
        w("internal/api/rest/handler/handler.go", REST_HANDLER)
        w("internal/api/rest/convert/convert.go", REST_CONVERT)
        w("internal/api/rest/server/server.go",   REST_SERVER)

    # gRPC
    if transport in ("grpc", "both"):
        w("internal/api/grpc/handler/handler.go", GRPC_HANDLER)
        w("internal/api/grpc/convert/convert.go", GRPC_CONVERT)
        w("internal/api/grpc/server/server.go",   GRPC_SERVER)
        gitkeep(out, "generated")

    step = 1

    def step_line(msg: str) -> None:
        nonlocal step
        print(f"  {step}. {msg}")
        step += 1

    print("\n── Next steps ──────────────────────────────────────────────────────────────")
    print(f"\n  cd {out}")
    print("  go mod tidy       # fetch all dependencies")
    print("  go build ./...    # verify it compiles\n")
    step_line("Rename the placeholder 'example' packages to your domain name")
    step_line("Add domain models to internal/domain/")
    step_line("Wire adapters and services in internal/app/app.go")
    step_line("Fill in real values in config/config.yaml")
    step_line("Write your first SQL migration in migrations/")
    if transport in ("rest", "both"):
        step_line("Define your API in api/openapi.yaml, then run: go generate ./...")
    if transport in ("grpc", "both"):
        step_line(f"Create the proto file at backend/schemas/proto/{name}/v1/{name}.proto, then run: make gen")
    step_line("Add interfaces to .mockery.yml and run: mockery")
    step_line("If adding to an existing project: update infra/testing/docker-compose.yaml and infra/production/k8s/")

    print("\n── Docs ─────────────────────────────────────────────────────────────────────")
    print("  docs/engineering/go/service-structure.md  — architecture layers and layout")
    print("  docs/engineering/go/dependencies.md       — library choices")
    print("  docs/engineering/go/testing.md            — table-driven tests and mockery")
    print("  docs/engineering/go/style.md              — nesting, length, parameters\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Scaffold a new Go microservice following the canonical project layout.",
    )
    parser.add_argument("--name",       required=True,
                        help="Service name in kebab-case, e.g. user-service")
    parser.add_argument("--module",     required=True,
                        help="Go module path as it appears in go.mod, e.g. github.com/org/project/user-service")
    parser.add_argument("--out",        required=True,
                        help="Output directory (created if it does not exist)")
    parser.add_argument("--transport",  default="both", choices=["rest", "grpc", "both"],
                        help="Transport layer to scaffold (default: both)")
    parser.add_argument("--go-version", default="1.25.8",
                        help="Go version to use in go.mod, .tool-versions, and Dockerfile (default: 1.25.8)")
    args = parser.parse_args()

    if os.path.exists(args.out) and os.listdir(args.out):
        print(f"error: '{args.out}' already exists and is not empty", file=sys.stderr)
        sys.exit(1)

    scaffold(args.name, args.module, args.out, args.transport, args.go_version)
