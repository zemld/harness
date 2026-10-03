# Frontend Stack

Source of truth for every layer of a personal frontend project. Other docs in this folder describe **how** to use each piece — this doc fixes **what** is used and **why**. Pin each choice; do not substitute without updating this file first.

## Pinned choices

| Layer             | Choice                                  | Notes                                              |
|-------------------|-----------------------------------------|----------------------------------------------------|
| Language          | TypeScript, `strict: true`              | `noUncheckedIndexedAccess`, `verbatimModuleSyntax` |
| UI framework      | React 19                                | Function components only                           |
| Build tool        | Vite 6                                  | SPA-first, no SSR                                  |
| Package manager   | pnpm                                    | Lockfile committed                                 |
| Routing           | React Router v7 (data router)           | Object route table, not JSX                        |
| Styling           | Tailwind CSS v4                         | No `tailwind.config.js` in v4                      |
| Components        | shadcn/ui (Radix + Tailwind)            | Copy-in, owned source                              |
| Icons             | lucide-react                            | shadcn default                                     |
| Toasts            | sonner                                  | shadcn default                                     |
| Server state      | TanStack Query v5                       | Hooks co-located in `features/<feature>/api.ts`    |
| Client state      | Zustand                                 | Opt-in; only when `useState`/Context isn't enough  |
| Forms             | React Hook Form                         | Always paired with Zod                             |
| Schema/validation | Zod                                     | Inferred TypeScript types from schemas             |
| API client        | `openapi-typescript` + `openapi-fetch`  | Consumes Go service `api/openapi.yaml`             |
| Unit tests        | Vitest                                  | Vite-native, replaces Jest                         |
| Component tests   | React Testing Library                   |                                                    |
| E2E tests         | Playwright                              |                                                    |
| Network mocking   | MSW (Mock Service Worker)               | Dev server and tests                               |
| Lint + format     | Biome                                   | Single binary, single config                       |
| Git hooks         | lefthook                                | Single YAML config                                 |
| Container runtime | nginx:alpine                            | Serves built SPA                                   |
| Container builder | node:22-alpine                          | Build stage of multi-stage Dockerfile              |

## Rationale

**TypeScript.** Non-negotiable. Caught at compile time is cheaper than caught at runtime. `strict` + `noUncheckedIndexedAccess` rule out the two largest classes of TS runtime bugs.

**React 19.** Largest ecosystem, every other library has a React adapter, hiring and AI-assistance both assume it.

**Vite over a meta-framework.** Personal projects almost never need SSR — server lives in Go. Removing the meta-framework layer removes a category of complexity (server components, edge runtime, build-time data fetching) that no use case here actually demands.

**pnpm.** Fastest mainstream package manager with a strict lockfile. Single content-addressable store means installing a second project costs near-zero disk.

**React Router v7.** Most ubiquitous router; the data-router API (loaders, actions, error boundaries) covers the patterns that previously required a meta-framework.

**Tailwind v4 + shadcn/ui.** Tailwind because utility-first scales to large apps without a CSS bikeshed; shadcn because copying components into the repo means no upstream breaking changes and full control over markup.

**TanStack Query.** Server state is its own problem (caching, deduplication, invalidation, refetch) and TanStack Query is the only library that solves all of it without imposing a framework.

**Zustand over Redux/Jotai.** Most projects need at most a handful of cross-cutting client values (theme, sidebar, command palette). Zustand expresses each one in 10 lines. Anything more structured is YAGNI until proven otherwise.

**React Hook Form + Zod.** RHF avoids re-render-per-keystroke; Zod gives one schema for both validation and TypeScript types, removing duplication between the form and the request payload.

**openapi-typescript + openapi-fetch.** Type-only codegen (no runtime bloat) keeps the frontend in sync with each Go service's `api/openapi.yaml` without coupling to a specific HTTP client.

**Vitest + RTL + Playwright + MSW.** Vitest because Vite-native is faster and shares config with the app; RTL because it tests behavior, not implementation; Playwright because it has overtaken Cypress on every axis that matters; MSW because the same mocks serve dev and tests.

**Biome over ESLint+Prettier.** One binary, one config file, ~20× faster, fewer plugins to chase. The ESLint ecosystem is richer, but personal projects use less than 5% of it.

**lefthook over husky.** Single YAML config, faster, no Node dependency at hook execution time.

**nginx + multi-stage Docker.** Mirrors the Go services' deploy story (Docker image into `infra/`). nginx serves static assets and proxies API calls to backend services — no Vercel/Netlify dependency, full control.

## Deliberately deferred

Each project picks its own when an actual need appears:

- **Auth** (Better Auth, Auth.js, custom JWT)
- **i18n** (react-i18next)
- **Error tracking** (Sentry)
- **Analytics** (Plausible, PostHog)
- **Storybook** — add only when the project has enough reusable components to justify it
- **Shared `@me/*` packages** (UI kit, eslint-config) — add only when a second project actually duplicates the same code
- **Astro/SSG track** for landings — current SPA covers landings via `vite-plugin-ssg` if SEO becomes critical
