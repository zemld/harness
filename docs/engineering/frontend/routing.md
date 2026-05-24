# Routing

React Router v7's data-router API (`createBrowserRouter` with route objects) is the only routing pattern used. The legacy `<Routes>` / `<Route>` JSX API is forbidden — it has no `loader`, no `errorElement`, and no way to express auth guards declaratively.

## Where the route table lives

`src/app/router.tsx` is the single place that declares every route. Routes are a flat array of objects, not nested JSX. Nesting is expressed via the `children` property on a route, not by component composition.

```tsx
import { createBrowserRouter } from "react-router";

import { AppShell } from "@/components/AppShell";
import { ErrorPage } from "@/pages/error/page";
import { LoginPage } from "@/pages/login/page";
import { PerfumesPage, perfumesLoader } from "@/pages/perfumes/page";
import { requireAuth } from "@/lib/auth-guards";

export const router = createBrowserRouter([
    {
        path: "/login",
        element: <LoginPage />,
        errorElement: <ErrorPage />,
    },
    {
        element: <AppShell />,
        loader: requireAuth,
        errorElement: <ErrorPage />,
        children: [
            {
                path: "/",
                element: <PerfumesPage />,
                loader: perfumesLoader,
            },
            // more authenticated routes here
        ],
    },
]);
```

`app/providers.tsx` wraps this router in `<RouterProvider router={router} />`.

## Pages

Each page lives in `src/pages/<route>/`. The folder contains the page component and its route-level loader:

```
src/pages/perfumes/
├── page.tsx     # Exports default PerfumesPage component
└── loader.ts    # Exports perfumesLoader, runs before render
```

Pages are thin: they read loader data, call feature hooks, and assemble feature components. Anything heavier belongs in `features/`.

## Loaders

**Use loaders for data that must be present before the page renders.** A list of perfumes for a list page, a single perfume for a detail page. The route does not render until the loader resolves.

**Pair loaders with TanStack Query.** The loader prefetches into the query cache via `queryClient.prefetchQuery(...)` and returns nothing. The component then reads the same key via `useQuery(...)` — no waterfall, no duplicate request.

```ts
import type { LoaderFunctionArgs } from "react-router";

import { queryClient } from "@/app/providers";
import { perfumeKeys } from "@/features/perfumes/api";
import { client } from "@/api/client";

export async function perfumesLoader(_args: LoaderFunctionArgs) {
    await queryClient.prefetchQuery({
        queryKey: perfumeKeys.list(),
        queryFn: async () => (await client.GET("/v1/perfumes")).data,
    });
    return null;
}
```

**Loaders return `null` when their only job is prefetch.** The component uses `useQuery` to read the prefetched data; loader-return-value plumbing via `useLoaderData` is only used when there is no corresponding query (rare).

## Auth guards

The `requireAuth` loader is the single source of truth for "must be logged in to see this":

```ts
import { redirect } from "react-router";

import { getAuthToken } from "@/lib/auth";

export function requireAuth() {
    if (!getAuthToken()) {
        throw redirect("/login");
    }
    return null;
}
```

Compose it onto a parent route whose `children` are protected (as in the example above). Never check auth inside individual page components — the redirect must happen before the protected page mounts.

## Error boundaries

**Every top-level route declares `errorElement`.** An unhandled throw — including the `requireAuth` redirect — is caught by the nearest `errorElement` ancestor. Without one, the entire app crashes to a blank screen.

A single `<ErrorPage />` component handles both kinds of errors (loader failures and render-time throws) by reading `useRouteError()` and branching on the shape.

## Layout routes

A route with no `path` but a child array is a layout route. Use it to share a shell (sidebar, topbar, auth guard) across many pages without repeating the wrapping in every page component. The `<AppShell />` example above is a layout route.

## URL state

**Search params for shareable filter/sort/pagination state.** Read and write via `useSearchParams()`. Do not store this in Zustand — the URL is the source of truth so refresh, share, and back-button all work.

**Path params for resource IDs.** `/perfumes/:id`, read via `useParams()`.

**Hash for non-shareable UI state** (currently open accordion section, scroll target).
