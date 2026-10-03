# Frontend Testing Conventions

## Contents
- Frameworks
- Structure
- Mocks
- Coverage targets
- Example — component test
- Example — Playwright spec

## Frameworks

**Unit and component tests:** [Vitest](https://vitest.dev) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro). One test config (`vitest.config.ts`) sharing Vite's resolver and plugins.

**End-to-end tests:** [Playwright](https://playwright.dev). One project per browser (chromium minimum; firefox + webkit optional).

**Network mocking:** [MSW](https://mswjs.io). The same handlers serve both `vitest` and the Vite dev server, so tests and local development hit the same fake backend.

## Structure

**AAA.** Each test follows Arrange / Act / Assert with an explicit blank line between sections. The same convention as the Go testing doc — consistency across the stack matters more than per-language micro-optimization.

**One behavior per test.** Each `it(...)` covers exactly one observable outcome. If two outcomes need testing, write two `it`s. Use `it.each(...)` when the same logic is exercised by multiple input/output pairs.

**Test behavior, not implementation.** Query by role, label, or text — never by class name, `data-testid`, or internal state. If a test breaks on a refactor that preserved behavior, the test was wrong.

**Co-located.** Unit and component tests sit next to the file under test (`Button.test.tsx` next to `Button.tsx`). E2E specs live under `tests/e2e/` because they cross feature boundaries.

**No snapshot tests.** Snapshots rot, get auto-accepted, and verify nothing meaningful. Assert specific behavior instead.

## Mocks

**MSW handlers in `src/mocks/`.** One file per Go service the frontend talks to (`mocks/notes.ts`, `mocks/auth.ts`). Each file exports an array of handlers; the array is composed in `src/mocks/handlers.ts`.

**Test-local handler overrides.** A test that needs a non-default response calls `server.use(http.get(...))` inside its Arrange block. Overrides reset between tests via `afterEach(() => server.resetHandlers())`.

**No `vi.mock` on the API client.** Mock the network layer (MSW), not the application code. Mocking `client.ts` couples tests to the wrapper's shape; mocking the network mirrors how the app actually fails in prod.

**Allowed `vi.mock` targets:** time (`vi.useFakeTimers()`), router (when testing a component in isolation from real navigation), and third-party SDKs without a network surface.

## Coverage targets

Required test coverage for a feature to count as done:

- **Happy path** — the primary success scenario.
- **Edge cases** — empty lists, zero values, boundary inputs, duplicate entries.
- **Error cases** — 4xx and 5xx responses surfaced through the UI, validation rejections.

A new feature without all three categories is not done. Modified existing components require tests for the modified behavior.

## Example — component test

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@/mocks/server";
import { TestProviders } from "@/test/providers";

import { PerfumeCard } from "./PerfumeCard";

describe("PerfumeCard", () => {
    it("shows the perfume name and brand", () => {
        // Arrange
        const perfume = { id: 1, name: "Aventus", brand: "Creed" };

        // Act
        render(<PerfumeCard perfume={perfume} />, { wrapper: TestProviders });

        // Assert
        expect(screen.getByRole("heading", { name: "Aventus" })).toBeVisible();
        expect(screen.getByText("Creed")).toBeVisible();
    });

    it("surfaces a toast when the favorite request fails", async () => {
        // Arrange
        server.use(
            http.post("/api/v1/favorites", () =>
                HttpResponse.json({ message: "db unavailable" }, { status: 500 }),
            ),
        );
        const user = userEvent.setup();
        render(<PerfumeCard perfume={{ id: 1, name: "Aventus", brand: "Creed" }} />, {
            wrapper: TestProviders,
        });

        // Act
        await user.click(screen.getByRole("button", { name: /favorite/i }));

        // Assert
        expect(await screen.findByRole("alert")).toHaveTextContent(/could not save/i);
    });
});
```

## Example — Playwright spec

```ts
import { expect, test } from "@playwright/test";

test("user can favorite a perfume from the catalog", async ({ page }) => {
    // Arrange
    await page.goto("/catalog");

    // Act
    await page.getByRole("article", { name: "Aventus" }).getByRole("button", { name: /favorite/i }).click();

    // Assert
    await expect(page.getByRole("article", { name: "Aventus" }).getByRole("button", { name: /favorited/i })).toBeVisible();
    await page.goto("/favorites");
    await expect(page.getByRole("article", { name: "Aventus" })).toBeVisible();
});
```
