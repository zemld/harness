# Frontend State Management

State has different lifetimes and ownership. Mixing them produces the worst bugs in a frontend codebase. Pick the right tool per layer; do not let server state leak into Zustand or component state leak into a context provider.

## Decision tree

```
Where does the value come from?
│
├── From the network (anything fetched from a Go service)
│       → TanStack Query
│
└── From the client only
        │
        ├── Used by a single component (or that component's children via props)
        │       → useState / useReducer
        │
        ├── Used across unrelated subtrees in the app
        │       → Zustand
        │
        └── Truly non-state (router, theme provider, query client)
                → useContext (provider pattern only — no mutable state)
```

## TanStack Query — server state

**Default for any value the backend owns.** This includes lists, details, current-user info, settings, feature flags fetched from a service.

**Never duplicate server data into Zustand.** Selecting a row from a list is `useState<number | null>` for the selected ID; the row data itself stays in the TanStack Query cache. Copying server data into a separate store invites stale-vs-fresh bugs.

**Query keys are hierarchical.** Use the factory pattern from `api-integration.md` (`perfumeKeys.all`, `perfumeKeys.list()`, `perfumeKeys.detail(id)`). Invalidating by prefix after mutations works correctly only when keys are structured.

**Invalidate on mutation success.** Mutations that change a resource invalidate the broadest matching key (`queryKey: perfumeKeys.all`) unless the change is precisely scoped, in which case invalidate the narrowest (`detail(id)`).

**Optimistic updates** are appropriate for boolean toggles (favorite, like, follow) and reordering. They are inappropriate for create/delete or anything that can fail a backend validation rule — roll-back logic is more code than it saves.

**`staleTime` defaults to `0`** project-wide (always-fresh). Override per-query when the data is genuinely slow-changing (`staleTime: 5 * 60 * 1000` for a user-settings query, for example). Setting a global `staleTime` masks staleness bugs.

## Zustand — cross-cutting client UI state

**One store per concern.** `useThemeStore`, `useSidebarStore`, `useCommandPaletteStore`. Do not build a single "app store" — small stores compose; big stores rot.

**Each store under `src/lib/stores/<name>.ts`.** Stores are part of the shared library layer, not features. A feature-scoped store almost always wants to be plain `useState` instead.

**Persist only what genuinely needs persistence.** Use `zustand/middleware`'s `persist` for theme and saved layout preferences. Do not persist transient UI state like "is the sidebar open".

**No async logic in stores.** A store action that does `await fetch(...)` is server state in disguise — move it to TanStack Query.

## `useState` / `useReducer` — component-local state

**Default for everything else.** Form draft fields, currently expanded row, hovered item. If two siblings need to share it, lift to their common parent; only escalate to Zustand when the common parent is the root.

**`useReducer` over `useState` when** the state has more than two related fields that update together. The reducer makes the state machine explicit and testable.

## `useContext` — providers, not state stores

Acceptable uses: theme provider, `QueryClientProvider`, `RouterProvider`, `TooltipProvider`. These wrap the tree and expose immutable values.

**Never use `useContext` for mutable state shared across the app.** That is what Zustand is for. Putting `useState` behind a context provider re-renders every consumer on every change, regardless of whether the consumer cares about the field that changed.

## Cache and store interaction

A common pattern that goes wrong: a feature needs both a TanStack Query value and a piece of client state derived from it (e.g. "currently selected perfume" out of a fetched list).

**Correct:** Zustand stores the selected `id: number | null`. The component reads the list via `usePerfumes()` and looks up the selected perfume locally (`perfumes.find(p => p.id === selectedId)`).

**Wrong:** Zustand stores the full selected `Perfume` object. Now the cached list and the stored object can diverge after a mutation.

The rule: stores store IDs, query cache stores entities.
