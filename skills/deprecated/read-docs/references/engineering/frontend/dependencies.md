# Frontend Dependencies

## Contents
- Runtime
- Styling
- Build tooling
- Testing
- Tooling

Every library pinned in `stack.md`, grouped by concern. Each section names the npm package and a one-paragraph reason. Replace nothing without updating `stack.md` first.

## Runtime

### UI framework

**Library:** `react`, `react-dom`

React 19. Function components only; no class components or legacy lifecycle methods.

---

### Routing

**Library:** `react-router`

React Router v7. Use the data-router API (`createBrowserRouter` + route objects with `loader` / `errorElement`). Do not use the legacy `<Routes>` / `<Route>` JSX API.

---

### Server state

**Library:** `@tanstack/react-query`

TanStack Query v5. One `QueryClient` lives in `app/providers.tsx`. Hooks (`useQuery`, `useMutation`) are co-located per feature in `features/<feature>/api.ts`.

---

### Client state

**Library:** `zustand`

Tiny client-state store. Only used for UI state shared across unrelated subtrees (theme, sidebar open, command palette). Server-derived state always lives in TanStack Query — never duplicated into Zustand.

---

### Forms

**Library:** `react-hook-form`

Avoids re-render-per-keystroke. Always paired with Zod through `@hookform/resolvers`.

---

### Validation

**Library:** `zod`, `@hookform/resolvers`

Zod is the single source of truth for runtime validation and inferred TypeScript types. `@hookform/resolvers/zod` glues it to React Hook Form.

---

### API client

**Library:** `openapi-fetch`

Tiny typed fetch wrapper that consumes the type definitions emitted by `openapi-typescript`. No runtime dependency on the schema — types only. Configured instance lives in `src/api/client.ts`.

## Styling

### CSS framework

**Library:** `tailwindcss`, `@tailwindcss/vite`

Tailwind CSS v4. Configured via the Vite plugin; no `tailwind.config.js` is required in v4. Theme tokens live in `src/styles/globals.css` as CSS variables.

---

### Component library

**Library:** `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `sonner`

shadcn/ui is not a package — components are copied into `src/components/ui/` via the shadcn CLI. Its runtime dependencies (Radix primitives, `cva`, `clsx`, `tailwind-merge`, `lucide-react` for icons, `sonner` for toasts) are installed as regular npm packages.

## Build tooling

### Bundler

**Library:** `vite`, `@vitejs/plugin-react`

Vite 6 with the React plugin. Provides dev server, HMR, and production build via Rollup.

---

### TypeScript

**Library:** `typescript`

TypeScript with `strict: true`, `noUncheckedIndexedAccess: true`, `verbatimModuleSyntax: true`. The compiler is used only for type-checking; Vite/esbuild handles transformation.

---

### API type generation

**Library:** `openapi-typescript`

Reads a Go service's `api/openapi.yaml` and emits `src/api/generated.ts` with types for every operation. Run via `pnpm run gen:api`. Commit the output. See `api-integration.md`.

## Testing

### Unit + component test runner

**Library:** `vitest`, `happy-dom`

Vitest replaces Jest. Uses `happy-dom` as the DOM implementation — lighter and faster than `jsdom` for the assertions React components actually make.

---

### Component test utilities

**Library:** `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`

React Testing Library. `user-event` simulates real user interaction; `jest-dom` adds matchers like `toBeVisible`, `toHaveTextContent`.

---

### E2E test runner

**Library:** `@playwright/test`

Playwright. Browsers pinned via `npx playwright install` in CI. Default project: chromium.

---

### Network mocking

**Library:** `msw`

Mock Service Worker. Handlers live in `src/mocks/`. The same handlers are served by the Vite dev server (so frontend can be developed without a running backend) and by Vitest (so tests do not hit the network).

## Tooling

### Lint + format

**Library:** `@biomejs/biome`

Single binary for lint and format. Configured via `biome.json`. Replaces ESLint + Prettier + their plugins.

---

### Git hooks

**Library:** `lefthook`

Pre-commit hooks. Runs `biome check --staged` and `tsc --noEmit` before each commit. Configured via `lefthook.yml`.
