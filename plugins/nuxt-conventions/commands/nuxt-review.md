---
description: Review the current diff against the Nuxt style guide and for over-engineering
---

Review the current changes (staged changes if any, otherwise the diff
against the default branch) of this Nuxt project. Load the
`nuxt-style-guide` skill first — it defines the conventions you are
checking against.

Report ONLY what ESLint cannot catch. Apply two lenses:

**1. Convention lens** — architecture violations in substance:
- Business logic or DB queries in a `server/api` route handler that
  belongs in a `server/services/*.service.ts`.
- A component, store, or composable doing HTTP directly instead of going
  through `app/api/*.api.ts`.
- Types or validation duplicated on one side instead of imported from
  `shared/models/`.
- A new endpoint without a Valibot schema validating its input.
- Files placed against the "where new code goes" table (e.g. a feature
  modal in a global folder, docs in the repo root, a test not mirroring
  its source path).
- Hardcoded user-facing strings that belong in i18n.

**2. Over-engineering lens** — the YAGNI ladder applied to the diff:
- New abstractions with a single caller; premature generalization.
- New code duplicating an existing composable, util, `common/` component,
  or an installed dependency's feature.
- Dead code, unused options, speculative config.
- For each: propose the concrete deletion or simplification.

Output: findings ranked by severity. Each finding: `file:line`, what is
wrong, and the proposed fix. Do NOT apply fixes — report only. If the diff
is clean, say so briefly.
