# Frontend Project Structure

```
<frontend>/
├── public/                       # Static assets served as-is by nginx
├── src/
│   ├── app/                      # Composition root
│   │   ├── App.tsx               # Root component
│   │   ├── providers.tsx         # QueryClientProvider, RouterProvider, theme
│   │   └── router.tsx            # Route table — flat array of objects
│   ├── pages/                    # One folder per route (page component + route-level loader)
│   │   └── <route>/
│   │       ├── page.tsx
│   │       └── loader.ts
│   ├── features/                 # Self-contained feature modules (unit of organization)
│   │   └── <feature>/
│   │       ├── api.ts            # TanStack Query hooks for this feature
│   │       ├── schemas.ts        # Zod schemas + inferred types
│   │       ├── components/       # UI used only by this feature
│   │       └── index.ts          # Public exports for consumers
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components (copied in — owned source)
│   │   └── <name>.tsx            # Cross-feature shared components
│   ├── lib/                      # Domain-free helpers (formatters, generic hooks)
│   ├── api/                      # Backend integration layer
│   │   ├── generated.ts          # `openapi-typescript` output — never edit by hand
│   │   └── client.ts             # Configured `openapi-fetch` instance + error mapping
│   ├── styles/
│   │   └── globals.css           # Tailwind entry + CSS variables
│   └── main.tsx                  # Vite entry point
├── tests/
│   └── e2e/                      # Playwright specs
├── deploy/
│   ├── Dockerfile                # Multi-stage: node builder → nginx runtime
│   └── nginx.conf                # SPA history fallback + API proxy
├── biome.json
├── lefthook.yml
├── tsconfig.json
├── vite.config.ts
├── package.json
└── README.md
```

## Rules

**`features/` is the unit of organization.** A feature owns its hooks, schemas, and UI. Cross-feature reuse means promoting code to `lib/` (logic) or `components/` (UI). Do not pre-promote — start scoped, promote on the second consumer.

**`api/generated.ts` is never edited by hand.** Regenerated from the consumed Go service's `api/openapi.yaml` (see `api-integration.md`). Commit the output; treat it like protobuf-generated code in Go services.

**Tests co-located.** `Button.test.tsx` lives next to `Button.tsx`. E2E specs are the only exception — they live under `tests/e2e/` because they cover flows across many components.

**No `src/utils/`.** Generic helpers go in `src/lib/`. The name `utils` invites unrelated dumping; `lib` signals "intentional shared library".

**No barrel `index.ts` files anywhere except `features/<feature>/index.ts`.** Barrels in `components/` and `lib/` defeat Vite's tree-shaking and slow type-checking. The single barrel per feature is the public contract for that feature.

**`pages/` is thin.** A page assembles components and triggers loaders. Business logic and data shaping live in `features/`. If a page exceeds ~80 lines, the missing feature module is the cause.

**`app/router.tsx` owns the full route table.** Routes are declared as a flat array of route objects, not nested JSX. Authentication guards, layouts, and error elements compose at this layer (see `routing.md`).
