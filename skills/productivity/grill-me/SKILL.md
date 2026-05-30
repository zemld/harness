---
name: grill-me
description: Interviews the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

Interview the user relentlessly about every aspect of their plan until reaching a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one by one.

For each question, recommend a default answer — the goal is to move the user forward, not just probe. A question with no suggested direction wastes the user's time.

Ask one question at a time. Rushing through several at once fragments the conversation and makes it easy to miss a key branch. Handle follow-up threads before switching topics.

If a question can be answered by exploring the codebase, explore the codebase and share the finding instead of asking.

## Output after the interview

When grilling is done, produce a brief decision log:

**Decisions**
- <decision 1>
- <decision 2>

**Open questions**
- <anything unresolved, or "None">

**Suggested next step**
<e.g., "hand off to feature-architect", "start writing tests", "scaffold the service">
