# Go Code Style

## Primary reference

Follow the [Uber Go Style Guide](https://github.com/uber-go/guide/blob/master/style.md) for all style decisions not covered here.

## Additional style conventions

These rules are stricter or more specific than Uber's guide and take precedence where they conflict.

**Nesting.** Maximum two levels of nested control flow (`if`, `for`, `switch`). At three, extract a helper or flatten with early returns.

**Function body.** Target under 30 lines of logic. Longer is a smell — defend it or split.

**Parameters.** Maximum 3. `context.Context` does not count. Group related inputs into a struct when the limit is exceeded.

**Return values.** Maximum 2 total; `error` counts as one. Return a struct instead of a tuple when you need more.

**No flag arguments.** A `bool` parameter that switches behavior is two functions fused into one. Split them.

**Early returns over nesting.** Handle errors and edge cases at the top of the function. Keep the happy path at the bottom indentation level.

**Comments.** Only write a comment when the *why* is non-obvious: a hidden constraint, a subtle invariant, a workaround for a specific bug. Never describe *what* the code does — well-named identifiers do that.
