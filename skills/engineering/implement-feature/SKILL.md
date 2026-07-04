---
name: implement-feature
description: Drives a feature to finished, reviewed, formatted state.
disable-model-invocation: true
---

Take folder with tasks and PRD document. This is the feature you need to implement.

## Processing flow

While some tasks aren't done or there are some issues with implementation:

1. Process each task in separate subagent. Tasks from one group can be processed concurrently.
2. When all tasks are done, spawn a subagent to review changes. Give it feature context and the code to review.
3. If review finds issues, return to the writer step to fix them in subagents.
