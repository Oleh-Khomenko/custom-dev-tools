# Nuxt Conventions Toolkit — Design

**Date:** 2026-07-16
**Status:** Approved (design), pending spec review
**Reference codebase:** `~/freelance-unity` (Nuxt 4, Vue 3, Pinia, Supabase, Valibot, SCSS, i18n)

## Goal

Distill the conventions of `freelance-unity` into reusable tooling for all future Nuxt projects, split by enforcement mechanism:

- **ESLint package** — everything machine-checkable (naming, layer boundaries, imports). Violations fail CI.
- **Claude Code plugin** — everything a linter can't express (where code goes, layered data flow, YAGNI discipline) plus a review command for architecture-level checks.

Conventions are **idealized**, not copied as-is: weaknesses found in the reference project (flat test dir, ungrouped composables, naming inconsistencies like `countries.ts` among `*.api.ts`, orphan `modals/` category) are fixed in the guide, not propagated.

## Repository layout

`~/custom-dev-tools` — pnpm workspace monorepo:

```
custom-dev-tools/
├── packages/
│   └── eslint-config-nuxt/              # → npm: @oleh-khomenko/eslint-config-nuxt (public)
│       ├── src/index.ts                 # flat-config factory
│       ├── package.json
│       └── README.md
├── plugins/
│   └── nuxt-conventions/                # Claude Code plugin
│       ├── .claude-plugin/plugin.json
│       ├── skills/
│       │   └── nuxt-style-guide/
│       │       └── SKILL.md
│       └── commands/
│           └── nuxt-review.md
├── .claude-plugin/marketplace.json      # install: /plugin marketplace add <repo>
├── docs/superpowers/specs/              # this spec
├── package.json                         # workspace root
├── pnpm-workspace.yaml
└── README.md
```

**Decision:** npm scope is `@oleh-khomenko` (changeable before first publish; one rename touches only `package.json` and docs).

## Package: `@oleh-khomenko/eslint-config-nuxt`

### Consumption

One line on top of Nuxt's generated config:

```js
// eslint.config.mjs in a Nuxt project
import withNuxt from './.nuxt/eslint.config.mjs'
import nuxtConventions from '@oleh-khomenko/eslint-config-nuxt'

export default withNuxt(...nuxtConventions())
```

Exports a factory returning an array of flat-config objects, so projects can pass options later without a breaking change. v1 takes no options.

### Rules

**File naming** (`check-file/filename-naming-convention` with per-directory globs — unicorn can't enforce suffixes like `*.api.ts`):

| Path | Case | Pattern |
|---|---|---|
| `app/components/**` | PascalCase | `Button.vue`, `MessageList.vue` |
| `app/composables/**` | kebab-case | `use-*.ts` |
| `app/api/**` | kebab-case | `*.api.ts` (no bare names) |
| `app/queries/**` | kebab-case | `*.queries.ts` |
| `server/services/**` | kebab-case | `*.service.ts` |
| `app/utils/**`, `shared/**` | kebab-case | — |

**Layer boundaries** (path-scoped `no-restricted-imports` / `no-restricted-syntax`; `eslint-plugin-boundaries` dropped — alias resolution makes it brittle, and all our rules are path-pattern based):

- `$fetch` / `useFetch` / `$api` calls forbidden in components, stores, composables — HTTP lives only in `app/api/*.api.ts`.
- `serverSupabaseClient` / `serverSupabaseServiceRole` (and DB access generally) allowed only in `server/services/**`; route handlers stay thin.
- `app/**` must not import from `server/**` and vice versa; both may import from `shared/**`.
- `shared/**` must not import from `app/**` or `server/**`.

**Vue conventions:**

- `vue/block-order`: `script` → `template` → `style` (+ trailing `i18n` block).
- `vue/component-api-style`: `<script setup>` only.
- `vue/define-macros-order`, `vue/require-typed-ref`, multi-word rule off for page components.

**General:** import ordering (`import/order` groups: node → external → `#imports`/aliases → relative), no default TS relaxations beyond Nuxt's own.

### Dependencies

Peer: `eslint >= 9`. Direct: `eslint-plugin-check-file` only. Vue and import-order rules assume `@nuxt/eslint` is present in the consumer (it ships `eslint-plugin-vue` and registers the import plugin); the factory only sets rule severities, it does not re-register those plugins.

### Publishing

Public npm, built with plain `tsc` to ESM. `prepublishOnly` runs lint + a smoke test that loads the config against a fixture Nuxt file tree and asserts expected violations fire.

## Plugin: `nuxt-conventions` (Claude Code)

### Skill: `nuxt-style-guide`

Auto-discovered by Claude when working in a Nuxt project. Content sections:

1. **Directory structure** — Nuxt 4 `app/` / `server/` / `shared/` canon, with a "where does new code go" decision table (new UI-kit component → `app/components/common/`; feature component → `app/components/page-components/<feature>/`; feature modal → same feature dir, not a global `modals/`; new endpoint → `server/api/<resource>/<name>.<method>.ts`; business logic → `server/services/<domain>.service.ts`; client HTTP → `app/api/<domain>.api.ts`; shared types/validation → `shared/models/<domain>/`).
2. **Layered data flow** — component → query/store → `app/api` client → `server/api` route (thin: validate + delegate) → service → DB. What each layer may and may not do.
3. **Client-server contract** — `shared/models/<domain>` TypeScript types + Valibot schemas in `shared/models/dto-validation`; same schema validates on client (useForm) and server (`getValidatedObject`).
4. **Naming** — table mirroring the ESLint rules, so Claude names things right the first time instead of after a lint failure.
5. **Idealized fixes** — composables grouped by domain subfolders; tests mirror source structure (`tests/server/`, `tests/composables/`) or are co-located; every `app/api` file uses the `.api.ts` suffix; docs live in `docs/`, not repo root.
6. **i18n pattern** — component-local `<i18n lang="json">` blocks for UI strings; global `/i18n/locales/*.ts` for server messages and validation errors; `useI18n()` + `t()`.
7. **UI patterns** — `useForm` composable for forms, CSS-variable theming, typography mixins; reuse `common/` components before creating new ones.
8. **YAGNI decision ladder** (adapted from the ponytail plugin) — run before writing any new code:
   1. Does this need to exist at all?
   2. Is there already a composable / util / service for it in this codebase?
   3. Does Nuxt / Vue / VueUse do it natively?
   4. Is there a `common/` component that covers it?
   5. Can an installed dependency do it?
   6. Only then: write the minimum that works.

   Laziness never applies to validation, auth, data-loss handling, or accessibility.

### Command: `/nuxt-review`

Diff-oriented review (current branch / staged changes) with two lenses, reporting only what ESLint cannot catch:

- **Convention lens:** layer violations in substance (logic in a route handler that belongs in a service; component doing HTTP; types duplicated instead of imported from `shared/models`), misplaced files, missing Valibot validation on a new endpoint, i18n strings hardcoded.
- **Over-engineering lens (ponytail-style):** dead abstractions, premature generalization, new code duplicating an existing composable/util/dependency — with concrete deletion/simplification suggestions.

Output: findings ranked by severity, each with file:line and a proposed fix. No auto-apply.

### Explicitly borrowed from ponytail

Decision ladder + review lens. **Not** borrowed: multi-platform adapters, hooks, intensity modes, metrics. If full ponytail behavior is wanted, it installs alongside as a separate plugin without conflict.

## Distribution

- **ESLint config:** `pnpm add -D @oleh-khomenko/eslint-config-nuxt` + one import.
- **Plugin:** `/plugin marketplace add <git-url-of-custom-dev-tools>` then `/plugin install nuxt-conventions`. Marketplace manifest lives at repo root, so the same repo serves both artifacts.

## Testing / verification

- ESLint package: fixture-based tests (vitest) — a mini Nuxt file tree where each rule has one violating and one passing sample.
- Skill/command: manual verification against `freelance-unity` — the review command must flag the known weaknesses (flat tests, `countries.ts` naming) and stay silent on conforming code.

## Out of scope (YAGNI)

- Scaffolding skills (`/new-feature`, `/new-nuxt-project`) — the style-guide skill lets Claude generate correct structure unaided; revisit if boilerplate creation becomes a measurable time sink.
- Starter-template repository.
- Prettier/formatting opinions beyond what `@nuxt/eslint` already handles.
- Reimplementing ponytail's full feature set.
