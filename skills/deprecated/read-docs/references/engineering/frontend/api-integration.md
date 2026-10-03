# Frontend ↔ Backend Integration

## Contents
- Pipeline overview
- Step 1 — generate types
- Step 2 — configured client
- Step 3 — feature hooks
- Errors
- Auth
- Boundary discipline

Every frontend talks to its Go services through the same three-piece pipeline: `openapi.yaml` from the service is the contract, `openapi-typescript` turns it into TS types, and `openapi-fetch` wraps the typed client. TanStack Query hooks consume that client per feature.

## Pipeline overview

```
backend/services/<go-service>/api/openapi.yaml
        │
        │  pnpm run gen:api  (calls openapi-typescript)
        ▼
frontend/<name>/src/api/generated.ts        ← committed; never edited by hand
        │
        │  imported by
        ▼
frontend/<name>/src/api/client.ts           ← configured openapi-fetch instance
        │
        │  imported by
        ▼
frontend/<name>/src/features/<feature>/api.ts   ← TanStack Query hooks
```

## Step 1 — generate types

`package.json` script:

```json
{
    "scripts": {
        "gen:api": "openapi-typescript ../../../backend/services/notes/api/openapi.yaml -o src/api/generated.ts"
    }
}
```

When a frontend consumes multiple Go services, add one script per service (`gen:api:notes`, `gen:api:auth`) and a top-level `gen:api` that fans out to all of them. Generated files live next to each other (`src/api/generated/notes.ts`, `src/api/generated/auth.ts`).

**Commit `generated.ts`.** It is treated like Go's `generated/` (protobuf) folder: machine-produced but versioned so consumers do not need backend access to build the frontend.

**Re-generation cadence.** Re-run `pnpm run gen:api` whenever the consumed service's `openapi.yaml` changes. CI runs the generator and fails the build if the committed `generated.ts` is stale.

## Step 2 — configured client

`src/api/client.ts` exposes a single configured `openapi-fetch` instance. It does three jobs: base URL injection, auth header injection, and error normalization.

```ts
import createClient, { type Middleware } from "openapi-fetch";

import { appConfig } from "@/lib/config";
import { getAuthToken } from "@/lib/auth";

import type { paths } from "./generated";

const authMiddleware: Middleware = {
    async onRequest({ request }) {
        const token = getAuthToken();
        if (token) request.headers.set("Authorization", `Bearer ${token}`);
        return request;
    },
};

const errorMiddleware: Middleware = {
    async onResponse({ response }) {
        if (response.ok) return response;
        const body = await response.clone().json().catch(() => ({}));
        throw new ApiError(response.status, body?.message ?? response.statusText, body);
    },
};

export const client = createClient<paths>({ baseUrl: appConfig.apiBaseUrl });
client.use(authMiddleware, errorMiddleware);

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
        public readonly body: unknown,
    ) {
        super(message);
        this.name = "ApiError";
    }
}
```

`appConfig.apiBaseUrl` comes from the runtime `config.js` pattern (see `deploy.md`), not from `import.meta.env.VITE_*`.

## Step 3 — feature hooks

Each feature owns its hooks in `features/<feature>/api.ts`. One hook per endpoint, returning the bare `useQuery` / `useMutation` result.

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { client } from "@/api/client";

const perfumeKeys = {
    all: ["perfumes"] as const,
    list: () => [...perfumeKeys.all, "list"] as const,
    detail: (id: number) => [...perfumeKeys.all, "detail", id] as const,
};

export function usePerfumes() {
    return useQuery({
        queryKey: perfumeKeys.list(),
        queryFn: async () => {
            const { data } = await client.GET("/v1/perfumes");
            return data;
        },
    });
}

export function useCreatePerfume() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: PerfumeInput) => {
            const { data } = await client.POST("/v1/perfumes", { body: input });
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: perfumeKeys.all }),
    });
}
```

**Query key convention.** Always use the hierarchical factory pattern (`feature.list()`, `feature.detail(id)`) so that mutations can invalidate by prefix (`feature.all`). Never write raw arrays at call sites.

## Errors

**`ApiError` is the single error type** the application code expects. TanStack Query catches the throw and exposes it via the `error` field of `useQuery` / `useMutation`. Components check `error instanceof ApiError` and branch on `error.status`.

**Validation errors (HTTP 400 / 422)** are mapped into form state via React Hook Form's `setError` (see `forms.md`).

**Network / 5xx errors** surface through sonner toasts and a generic retry button. Do not show the raw error message to users — log it and show a friendly fallback.

## Auth

`getAuthToken()` lives in `src/lib/auth.ts`. The token storage choice (httpOnly cookie via backend, localStorage, in-memory) is per-project and not pinned here — the contract is just "give me a string or null". The middleware does the rest.

## Boundary discipline

- **No `fetch` outside `src/api/`.** All network calls go through the configured `client`. A direct `fetch` somewhere in `features/` is a bug.
- **No `any` in `api/client.ts`.** Types come from `generated.ts`; if a type is missing, the OpenAPI spec is incomplete and the backend should be fixed first.
- **No request shaping in components.** Components call hooks; hooks shape requests. A component that constructs a request body inline is bypassing the layer.
