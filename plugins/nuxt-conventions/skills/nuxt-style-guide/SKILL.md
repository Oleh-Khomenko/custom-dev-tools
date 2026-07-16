---
name: nuxt-style-guide
description: Use when writing or modifying code in a Nuxt project (app/ + server/ + shared/ layout) — where new code goes, layer architecture, naming, client-server contract, i18n, and YAGNI rules
---

# Nuxt Style Guide

Conventions for Nuxt 4 projects. The companion ESLint package
`@oleh-khomenko/eslint-config-nuxt` enforces the machine-checkable subset;
this skill covers placement, architecture, and judgment calls.

## YAGNI decision ladder — run BEFORE writing any new code

1. Does this need to exist at all?
2. Is there already a composable / util / service for it in this codebase?
3. Does Nuxt / Vue / VueUse do it natively?
4. Is there a component in `app/components/common/` that covers it?
5. Can an installed dependency do it?
6. Only then: write the minimum that works.

Laziness NEVER applies to validation, auth, data-loss handling, or
accessibility — those are always implemented fully.

## Where new code goes

| You are adding | Put it in |
|---|---|
| Reusable UI-kit component | `app/components/common/PascalCase.vue` |
| Feature component | `app/components/page-components/<feature>/PascalCase.vue` |
| Feature modal | same feature dir — NOT a global `modals/` folder |
| Page | `app/pages/<route>.vue` |
| Client HTTP call | `app/api/<domain>.api.ts` (always the `.api.ts` suffix) |
| TanStack-style query wrapper | `app/queries/<domain>.queries.ts` |
| Pinia store | `app/stores/<kebab-case>.ts` |
| Composable | `app/composables/<domain>/use-<name>.ts` (group by domain) |
| API endpoint | `server/api/<resource>/<name>.<method>.ts` (Nitro convention) |
| Business logic / DB access | `server/services/<domain>.service.ts` |
| Shared types + constants | `shared/models/<domain>/` |
| Validation schema | `shared/models/dto-validation/` (Valibot) |
| Unit test | mirror the source path: `tests/server/...`, `tests/composables/...` |
| Docs | `docs/` — never the repo root |

## Layered data flow

```
component → query/store → app/api client → server/api route → service → DB
```

- **Components/pages/stores/composables** never call `$fetch`/`useFetch`
  directly — they call functions from `app/api/*.api.ts`.
- **`app/api` clients** are thin typed wrappers around `$fetch` — no
  business logic, no state.
- **`server/api` routes** are thin: validate input with the shared Valibot
  schema (`getValidatedObject`), call a service, return. No DB access, no
  business logic in handlers.
- **`server/services`** own business logic and ALL database access
  (`serverSupabaseClient` / `serverSupabaseServiceRole` live only here).
- **`shared/`** depends on nothing from `app/` or `server/`.

## Client-server contract

Every endpoint's request/response types live in `shared/models/<domain>/`,
and its input validation is a Valibot schema in
`shared/models/dto-validation/`. The SAME schema validates on the client
(via `useForm`) and on the server (via `getValidatedObject`). Never
duplicate a type on one side — import it from `shared/`.

## Naming

| Path | Convention |
|---|---|
| `app/components/**` | `PascalCase.vue` |
| `app/composables/**` | `use-kebab-case.ts` |
| `app/api/**` | `kebab-case.api.ts` |
| `app/queries/**` | `kebab-case.queries.ts` |
| `app/stores/**`, `app/utils/**`, `shared/**` | `kebab-case.ts` |
| `server/services/**` | `kebab-case.service.ts` |
| `server/api/**` | Nitro: `index.get.ts`, `[id].patch.ts` |

## i18n

- UI strings specific to one component: component-local
  `<i18n lang="json">` block (trailing block, after `<style>`), read via
  `const { t } = useI18n()`.
- Server messages, validation errors, shared vocabulary: global
  `/i18n/locales/<lang>.ts`.
- Never hardcode user-facing strings.

## UI patterns

- Forms: the `useForm` composable + shared Valibot schema — not ad-hoc
  `ref`s with manual validation.
- Components: `<script setup lang="ts">`, typed props interface, blocks
  ordered `script → template → style → i18n`.
- Theming: CSS custom properties and typography mixins — no hardcoded
  colors or font sizes in components.
- Before creating a component, check `app/components/common/` for one that
  already fits (Button, Input, Select, Modal, Toast, ...).

## Tooling

- The companion ESLint config needs `@nuxt/eslint`'s `stylistic` and
  `typescript` features enabled in `nuxt.config.ts`:
  `eslint: { config: { stylistic: true, typescript: true } }`. The
  `typescript` feature registers the `@typescript-eslint` plugin the
  config's type rules depend on; `stylistic` registers `@stylistic`.
