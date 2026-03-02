---
description: Model Sandwich Protocol instructions for consistent workflow across the project.
---

# Model Sandwich Protocol

## Phase 1: Planning (Architect Mode)
When a new feature is requested, DO NOT write code immediately.
Generate a detailed plan.md artifact.
Wait for user confirmation.

## Phase 2: Execution (Builder Mode)
Once the plan is approved, use the broad context to implement changes across the files mentioned.
Run terminal tests after every major file update.

## Phase 3: Deployment (Git Agent)
After verification, use the terminal to run `git add .`.
Draft a commit message that summarizes the changes based on the original plan.md.
Wait for approval to run `git push`.
