#!/usr/bin/env python3
"""Frontend project scaffold.

Materializes the layout described in docs/engineering/frontend/index.md
(Scaffold project section). Conventions live in the docs; this script is
the implementation that produces them.

Usage:
    python scaffold.py --name <kebab-name> --out <path> \
        [--backend-openapi <relative-path-to-upstream-api/openapi.yaml>]
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path


RUNTIME_DEPS = [
    "react", "react-dom", "react-router",
    "@tanstack/react-query", "zustand",
    "react-hook-form", "zod", "@hookform/resolvers",
    "openapi-fetch",
]

STYLING_DEPS = [
    "tailwindcss", "@tailwindcss/vite",
    "@radix-ui/react-slot", "class-variance-authority", "clsx", "tailwind-merge",
    "lucide-react", "sonner",
]

TEST_DEPS = [
    "vitest", "happy-dom",
    "@testing-library/react", "@testing-library/user-event", "@testing-library/jest-dom",
    "@playwright/test", "msw",
]

TOOLING_DEPS = [
    "@biomejs/biome", "lefthook", "openapi-typescript", "typescript",
]


def run(cmd: list[str], cwd: Path | None = None) -> None:
    print(f"$ {' '.join(cmd)}")
    subprocess.run(cmd, cwd=cwd, check=True)


def ensure_pnpm() -> None:
    if shutil.which("pnpm") is None:
        sys.exit("pnpm is required. Install via `corepack enable && corepack prepare pnpm@latest --activate`.")


def write_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.lstrip("\n"))
    print(f"  wrote {path}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--name", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--backend-openapi", default="")
    args = parser.parse_args()

    ensure_pnpm()

    out = Path(args.out).expanduser().resolve()
    parent = out.parent
    parent.mkdir(parents=True, exist_ok=True)

    if out.exists():
        sys.exit(f"output directory already exists: {out}")

    run(["pnpm", "create", "vite@latest", out.name, "--template", "react-ts"], cwd=parent)

    run(["pnpm", "add", *RUNTIME_DEPS], cwd=out)
    run(["pnpm", "add", *STYLING_DEPS], cwd=out)
    run(["pnpm", "add", "-D", *TEST_DEPS], cwd=out)
    run(["pnpm", "add", "-D", *TOOLING_DEPS], cwd=out)

    write_configs(out)
    write_directory_layout(out)
    write_boilerplate(out)
    patch_package_json(out, args.backend_openapi)

    run(["pnpm", "exec", "lefthook", "install"], cwd=out)
    run(["pnpm", "tsc", "--noEmit"], cwd=out)
    run(["pnpm", "biome", "check", "."], cwd=out)

    print()
    print(f"Frontend project scaffolded at {out}")
    print("Next steps (per docs/engineering/frontend/index.md Scaffold section):")
    print("  - Configure gen:api script if backend OpenAPI path was not set.")
    print("  - Bring in shadcn primitives via `pnpm dlx shadcn@latest init` + `add <primitive>`.")
    print("  - Add a real page under src/pages/<route>/ and register in src/app/router.tsx.")
    print("  - Implement MSW handlers in src/mocks/handlers.ts for the first feature.")
    print("  - Add infra entries per docs/engineering/frontend/deploy.md.")


def write_configs(out: Path) -> None:
    write_file(out / "tsconfig.json", TSCONFIG)
    write_file(out / "vite.config.ts", VITE_CONFIG)
    write_file(out / "biome.json", BIOME_CONFIG)
    write_file(out / "lefthook.yml", LEFTHOOK_CONFIG)


def write_directory_layout(out: Path) -> None:
    for sub in ["src/app", "src/pages", "src/features",
                "src/components/ui", "src/lib",
                "src/api", "src/styles", "src/mocks",
                "tests/e2e", "deploy", "public"]:
        (out / sub).mkdir(parents=True, exist_ok=True)
    for keep_dir in ["src/pages", "src/features",
                     "src/components/ui", "src/lib", "tests/e2e"]:
        (out / keep_dir / ".gitkeep").touch()


def write_boilerplate(out: Path) -> None:
    write_file(out / "src/app/App.tsx", APP_TSX)
    write_file(out / "src/app/providers.tsx", PROVIDERS_TSX)
    write_file(out / "src/app/router.tsx", ROUTER_TSX)
    write_file(out / "src/api/client.ts", API_CLIENT)
    write_file(out / "src/api/generated.ts", API_GENERATED_PLACEHOLDER)
    write_file(out / "src/styles/globals.css", GLOBALS_CSS)
    write_file(out / "src/mocks/handlers.ts", MOCKS_HANDLERS)
    write_file(out / "src/main.tsx", MAIN_TSX)
    write_file(out / "tests/setup.ts", TESTS_SETUP)
    write_file(out / "deploy/Dockerfile", DOCKERFILE)
    write_file(out / "deploy/nginx.conf", NGINX_CONF)
    write_file(out / "public/config.js", PUBLIC_CONFIG_JS)


def patch_package_json(out: Path, backend_openapi: str) -> None:
    pkg_path = out / "package.json"
    pkg = json.loads(pkg_path.read_text())
    gen_api = (
        f"openapi-typescript {backend_openapi} -o src/api/generated.ts"
        if backend_openapi
        else "echo 'configure backend OpenAPI path in package.json gen:api script'"
    )
    pkg["scripts"] = {
        "dev": "vite",
        "build": "tsc --noEmit && vite build",
        "preview": "vite preview",
        "test": "vitest run",
        "test:watch": "vitest",
        "e2e": "playwright test",
        "format": "biome check --write .",
        "lint": "biome check .",
        "typecheck": "tsc --noEmit",
        "gen:api": gen_api,
        "prepare": "lefthook install",
    }
    pkg_path.write_text(json.dumps(pkg, indent=2) + "\n")
    print(f"  patched {pkg_path}")


TSCONFIG = """
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": false,
    "isolatedModules": true,
    "useDefineForClassFields": true,
    "allowImportingTsExtensions": false,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src", "tests"]
}
"""

VITE_CONFIG = """
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
});
"""

BIOME_CONFIG = """
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": { "quoteStyle": "double", "semicolons": "always" }
  }
}
"""

LEFTHOOK_CONFIG = """
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{ts,tsx,js,jsx,json,css}"
      run: pnpm biome check --staged --no-errors-on-unmatched {staged_files}
    tsc:
      run: pnpm tsc --noEmit
"""

APP_TSX = """
import { Providers } from "./providers";
import { AppRouter } from "./router";

export function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}
"""

PROVIDERS_TSX = """
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
"""

ROUTER_TSX = """
import { createBrowserRouter, RouterProvider } from "react-router";

const router = createBrowserRouter([
  { path: "/", element: <div>Replace me with src/pages/home/page.tsx</div> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
"""

API_CLIENT = """
import createClient from "openapi-fetch";
import type { paths } from "./generated";

const baseUrl =
  (typeof window !== "undefined" && (window as any).__APP_CONFIG__?.apiBaseUrl) ??
  "/api";

export const apiClient = createClient<paths>({ baseUrl });
"""

API_GENERATED_PLACEHOLDER = """
// This file is regenerated by `pnpm run gen:api`.
// Do not edit by hand.
export type paths = Record<string, never>;
"""

GLOBALS_CSS = """
@import "tailwindcss";

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
}

body {
  background: var(--background);
  color: var(--foreground);
}
"""

MOCKS_HANDLERS = """
import type { HttpHandler } from "msw";

// Add MSW handlers per feature here. Both the Vite dev server and Vitest
// import this list, so the same mocks back development and tests.
export const handlers: HttpHandler[] = [];
"""

MAIN_TSX = """
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
"""

TESTS_SETUP = """
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "../src/mocks/handlers";

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
"""

DOCKERFILE = """
# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \\
    pnpm install --frozen-lockfile

COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN pnpm run build

FROM nginx:alpine AS runtime
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
"""

NGINX_CONF = """
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /api/ {
        proxy_pass http://${BACKEND_HOST}:${BACKEND_PORT}/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
"""

PUBLIC_CONFIG_JS = """
window.__APP_CONFIG__ = { apiBaseUrl: "__API_BASE_URL__" };
"""


if __name__ == "__main__":
    main()
