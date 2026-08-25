# Go Code Style

## Primary reference

Follow the [Uber Go Style Guide](https://github.com/uber-go/guide/blob/master/style.md) for all style decisions not covered here.

## Review-derived rules

### `GO-REUSE-01` — nearest existing analogue (`DEFAULT`)

- **Condition:** the change adds an operation, component, infrastructure file, or convention similar to an existing one.
- **Requirement:** find the nearest current analogue and reuse its implementation or convention when the required contract matches.
- **PASS:** the existing solution is reused, or a concrete contract difference proves that a new implementation is necessary.
- **FAIL:** a parallel implementation of the same contract is added without a proven difference.
- **BLOCKED:** available search cannot establish whether an analogue exists.
- **Evidence:** path to the analogue and a contract comparison.

### `GO-SIMPLE-01` — indirection layer (`REVIEW_TRIGGER`)

- **Condition:** the change adds a wrapper around one call, a constructor over another constructor, a provider, or a separate pass-through layer.
- **Requirement:** keep the layer only when it owns behavior, transformation, an invariant, or a resource; otherwise call the lower layer directly.
- **PASS:** the layer performs at least one listed responsibility, or it is removed.
- **FAIL:** the layer only repeats a signature and delegates the call.
- **Exception:** the interface or function is required by a framework contract; cite the implemented contract.

### `GO-CONTRACT-01` — related parameters (`DEFAULT`)

- **Condition:** an operation accepts more than three parameters excluding `context.Context`, or several parameters form one set that changes together.
- **Requirement:** group related values into a named type; keep constructor dependencies as separate parameters.
- **PASS:** the signature has at most three independent parameters or one named type for the related set.
- **FAIL:** a related set is passed as separate arguments and inflates the signature.
- **Exception:** the parameters are independent and stable, and the contract makes that clear.

### `GO-CONTRACT-02` — value shape (`MUST`)

- **Condition:** a contract uses a pointer, nullable or optional value, slice, or another collection instead of one required value.
- **Requirement:** every broader shape must correspond to a concrete runtime scenario with distinct semantics.
- **PASS:** code and tests demonstrate distinct behavior for an absent value or multiple elements.
- **FAIL:** the shape permits states that no caller creates or handles.
- **BLOCKED:** the ticket or contract does not define the scenario.

### `GO-TYPE-01` — closed state set (`MUST`)

- **Condition:** a value has a finite set of valid states or outcomes.
- **Requirement:** represent the set with a named type, avoid intermediate conversion through `string`, and handle unknown values explicitly.
- **PASS:** signatures and comparisons use typed constants, and a `switch` has an explicit branch for an unknown value.
- **FAIL:** state is checked as an arbitrary string, loses its type during conversion, or silently accepts an unknown value.

### `GO-ERROR-01` — distinguishable failure causes (`MUST`)

- **Condition:** the caller must react differently to two or more failure causes.
- **Requirement:** preserve the causes as typed or sentinel errors and inspect them with `errors.Is`, `errors.As`, or a concrete type.
- **PASS:** the caller distinguishes causes without parsing error text.
- **FAIL:** distinct causes collapse into one indistinguishable result or are detected through message fragments.
- **N/A:** the contract requires the same reaction for every cause.

### `GO-NAMING-01` — name reflects responsibility (`MUST`)

- **Condition:** the change adds or renames a package, type, method, field, or file.
- **Requirement:** the name and location describe the domain responsibility or bounded context, not an incidental technical detail or a neighboring use case.
- **PASS:** the name predicts the contract and the path matches the owner of the responsibility.
- **FAIL:** the name promises a different contract, hides the domain purpose, or places code in another context.

### `GO-CONST-01` — repeated static values (`DEFAULT`)

- **Condition:** one static code or message is repeated, or it is part of an external contract.
- **Requirement:** declare a named constant and follow the package's naming style.
- **PASS:** the value has one declaration and callers use its name.
- **FAIL:** one contract value is duplicated as literals or named contrary to local style.

## Additional style conventions

These rules are stricter or more specific than Uber's guide and take precedence where they conflict.

**Nesting.** Maximum two levels of nested control flow (`if`, `for`, `switch`). At three, extract a helper or flatten with early returns.

**Function body.** Target under 30 lines of logic. Longer is a smell — defend it or split.

**Parameters.** Maximum 3. `context.Context` does not count. Group related inputs into a struct when the limit is exceeded. **Exception — constructors:** `NewXxx` functions may have as many parameters as they have dependencies; each dependency gets its own parameter.

**Return values.** Maximum 2 total; `error` counts as one. Return a struct instead of a tuple when you need more.

**No flag arguments.** A `bool` parameter that switches behavior is two functions fused into one. Split them.

**Early returns over nesting.** Handle errors and edge cases at the top of the function. Keep the happy path at the bottom indentation level.

**Comments.** Only write a comment when the *why* is non-obvious: a hidden constraint, a subtle invariant, a workaround for a specific bug. Never describe *what* the code does — well-named identifiers do that.
