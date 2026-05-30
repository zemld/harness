# Forms

## Contents
- Schema placement
- Form component pattern
- Mapping server validation errors
- Submission feedback
- Field components

Every form in the app follows the same pattern: a Zod schema is the single source of truth for shape and validation, React Hook Form binds the schema to inputs, and submission failures are mapped back into form state instead of toasted away.

## Schema placement

**Schemas live in `features/<feature>/schemas.ts`.** Each schema exports both the Zod object and the inferred TypeScript type:

```ts
import { z } from "zod";

export const createPerfumeSchema = z.object({
    name: z.string().min(1, "Name is required").max(120),
    brand: z.string().min(1, "Brand is required"),
    year: z.number().int().min(1900).max(new Date().getFullYear()),
    notes: z.array(z.string()).min(1, "At least one note is required"),
});

export type CreatePerfumeInput = z.infer<typeof createPerfumeSchema>;
```

**One schema per form.** Do not reuse a single schema for create and edit — the constraints differ (required fields, server-assigned IDs). Compose with `.pick()`, `.omit()`, and `.extend()` when there is genuine overlap.

**Schemas mirror, not replace, generated types.** The OpenAPI generator (`src/api/generated.ts`) gives you the request payload type. The Zod schema validates user input *before* it reaches that shape. When the two disagree, the Zod schema wins for the form's perspective and the difference is bridged in the submit handler.

## Form component pattern

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ApiError } from "@/api/client";

import { useCreatePerfume } from "./api";
import { createPerfumeSchema, type CreatePerfumeInput } from "./schemas";

export function CreatePerfumeForm() {
    const form = useForm<CreatePerfumeInput>({
        resolver: zodResolver(createPerfumeSchema),
        defaultValues: { name: "", brand: "", year: new Date().getFullYear(), notes: [] },
    });
    const createPerfume = useCreatePerfume();

    const onSubmit = form.handleSubmit(async (values) => {
        try {
            await createPerfume.mutateAsync(values);
            toast.success("Perfume created");
            form.reset();
        } catch (err) {
            if (err instanceof ApiError && err.status === 422) {
                applyServerErrors(form, err.body);
                return;
            }
            toast.error("Could not create perfume");
        }
    });

    return (
        <form onSubmit={onSubmit}>
            {/* fields */}
            <button type="submit" disabled={form.formState.isSubmitting}>
                Create
            </button>
        </form>
    );
}
```

Key contracts:

- **`resolver: zodResolver(schema)`** — never a hand-written validator.
- **`defaultValues` always provided** — uncontrolled inputs without defaults make React Hook Form's reset/dirty-state behavior unreliable.
- **`form.handleSubmit(...)` wraps the submit handler** — never call the mutation from a plain `onClick`.
- **`disabled={form.formState.isSubmitting}`** on the submit button — prevents double-submit.

## Mapping server validation errors

When the backend returns a 422 with field-level errors, surface them on the inputs rather than as a toast. The shape of the error body comes from the Go service's OpenAPI spec; map it once in a helper:

```ts
import type { UseFormReturn } from "react-hook-form";

interface ServerValidationError {
    fields?: Record<string, string>;
}

export function applyServerErrors(
    form: UseFormReturn<any>,
    body: unknown,
) {
    const { fields } = (body ?? {}) as ServerValidationError;
    if (!fields) return;
    for (const [name, message] of Object.entries(fields)) {
        form.setError(name as never, { type: "server", message });
    }
}
```

The helper lives in `src/lib/forms.ts` and is shared across all features. If your backend uses a different error shape, change the helper once — never inline the mapping per form.

## Submission feedback

| Outcome              | Surface                                                    |
|----------------------|------------------------------------------------------------|
| Success              | `toast.success(...)` from sonner + `form.reset()`          |
| Field validation 4xx | `applyServerErrors(...)` — error appears under the input   |
| Other failure        | `toast.error("...")` with a generic message                |

Never silently swallow a submission failure. Never show the raw `ApiError.message` to users — those strings are for logs.

## Field components

Use shadcn/ui's `<Form>` primitives (`FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`). They wire React Hook Form's `Controller` to shadcn inputs and surface `formState.errors` automatically — no need to render error text by hand.
