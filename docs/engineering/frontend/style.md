# Frontend Code Style

## Primary reference

Biome's [recommended ruleset](https://biomejs.dev/linter/rules/) is the baseline. Every project enables it via `"extends": ["biome:recommended"]` in `biome.json`. Anything not covered below defers to Biome's defaults.

## Additional style conventions

These rules are stricter or more specific than Biome's defaults and take precedence where they conflict.

**Function components only.** No class components. State, lifecycle, and side effects all go through hooks. A class component is grounds for splitting or rewriting.

**Props typed via `interface`, not `React.FC`.** Declare `interface ButtonProps { ... }` and use `function Button(props: ButtonProps)`. Never use `React.FC` or `React.FunctionComponent` — they imply `children` even when none is intended and break generic component typing.

**Component body budget: ~150 lines.** Longer is a smell. Split by extracting either a child component (UI responsibility) or a custom hook (state/effect responsibility). Never split by introducing a `bool` prop that toggles behavior — that fuses two components into one.

**Custom hooks always prefixed `use`.** Called only at the top level of a component or another hook — never inside conditions, loops, or callbacks. Biome's `useExhaustiveDependencies` rule is on; never disable it locally.

**Imports grouped and sorted by Biome.** Order: standard libs → external deps → internal absolute (`@/`) → relative. Do not hand-sort.

**Path alias `@/` points to `src/`.** Configure in both `tsconfig.json` (`paths`) and `vite.config.ts` (`resolve.alias`). All cross-feature imports use `@/`; relative imports only within the same folder.

**Tailwind class ordering by Biome.** Enable `useSortedClasses`. Do not hand-order Tailwind classes.

**No `any`.** If a type is truly unknown, use `unknown` and narrow. `any` is only allowed in declaration files for third-party libs without types.

**Discriminated unions over optional fields.** When a value's shape depends on a flag, model it as `{ kind: "a"; ... } | { kind: "b"; ... }` instead of `{ kind: string; aField?: ...; bField?: ... }`. The former gives exhaustiveness checking; the latter pushes runtime errors into prod.

**Server data shapes come from `src/api/generated.ts`.** Never redeclare types that exist in the generated OpenAPI output. Derive variations with `Pick`, `Omit`, or Zod's `.pick()` on the request schema.

**Comments only when the *why* is non-obvious.** A hidden constraint, a subtle invariant, a workaround for a specific upstream bug. Never describe *what* the code does — well-named identifiers and types already do that.

**Co-located styles.** No separate CSS files per component. Styling is Tailwind in JSX. The only CSS files are `src/styles/globals.css` (Tailwind entry + CSS variables for theme tokens).
