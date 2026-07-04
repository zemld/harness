---
name: divide-prd-to-tasks
description: Divides PRD into small concrete tasks. Reads the PRD file and emphasizes tasks with clear, actionable descriptions and order.
disable-model-invocation: true
---

Read carefully the PRD file. Detect the tasks which are needed to complete the PRD.
Each task should be concrete, simple, clear and actionable.
Each task must be a single, self-contained unit of work without any references to sibling tasks.

For each task write a md file with the task and it's details.

Also you need to determine the order in which the tasks should be completed.

Be clear in order for each feature:

1. Interfaces and models
2. Tests
3. Implementation (always depends on interfaces and models and also tests)
4. Infrastructure (docker, kubernetes, etc.)
