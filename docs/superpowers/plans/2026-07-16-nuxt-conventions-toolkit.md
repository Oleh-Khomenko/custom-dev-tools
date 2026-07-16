# Nuxt Conventions Toolkit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `~/custom-dev-tools`: a public npm package `@oleh-khomenko/eslint-config-nuxt` (machine-enforceable Nuxt conventions) and a Claude Code plugin `nuxt-conventions` (style-guide skill + `/nuxt-review` command), distilled from `~/freelance-unity`.

**Architecture:** pnpm workspace monorepo. The ESLint package is a flat-config factory (`nuxtConventions(): Linter.Config[]`) appended to a Nuxt project's `withNuxt()`; rules are path-scoped config objects. The Claude plugin is pure markdown (skill + command) served from the same repo via a marketplace manifest.

**Tech Stack:** TypeScript (tsc, ESM), ESLint 9 flat config, eslint-plugin-check-file, vitest (tests lint virtual files via the `ESLint` class), Claude Code plugin format.

**Spec:** `docs/superpowers/specs/2026-07-16-nuxt-conventions-toolkit-design.md`

## Global Constraints

- npm scope: `@oleh-khomenko`; package published public (`publishConfig.access: "public"`).
- Repo root: `/Users/oleghomenko/custom-dev-tools`. All paths below are relative to it.
- Runtime dependency of the package: `eslint-plugin-check-file` ONLY. Peer: `eslint >= 9`. Vue/import-order rules assume consumer has `@nuxt/eslint` (documented, not depended on).
- ESM only (`"type": "module"`), built with plain `tsc` to `dist/`.
- Commits: short one-line messages, NO `Co-Authored-By` trailer (user preference).
- The plugin contains exactly one skill (`nuxt-style-guide`) and one command (`/nuxt-review`). No scaffolding skills, no hooks (YAGNI).

---

### Task 1: Workspace scaffold

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.gitignore`

**Interfaces:**
- Produces: pnpm workspace that later tasks install/build inside; `packages/*` is the only workspace glob.

- [ ] **Step 1: Write workspace files**

`package.json`:
```json
{
  "name": "custom-dev-tools",
  "private": true,
  "packageManager": "pnpm@10.12.1"
}
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - packages/*
```

`.gitignore`:
```
node_modules/
dist/
.DS_Store
```

- [ ] **Step 2: Verify pnpm accepts the workspace**

Run: `cd /Users/oleghomenko/custom-dev-tools && pnpm install`
Expected: exits 0, creates `pnpm-lock.yaml` (empty importers are fine).

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "Scaffold pnpm workspace"
```

---

### Task 2: ESLint package skeleton

**Files:**
- Create: `packages/eslint-config-nuxt/package.json`
- Create: `packages/eslint-config-nuxt/tsconfig.json`
- Create: `packages/eslint-config-nuxt/src/index.ts`
- Create: `packages/eslint-config-nuxt/src/types.d.ts`
- Test: `packages/eslint-config-nuxt/tests/factory.test.ts`

**Interfaces:**
- Produces: `nuxtConventions(): Linter.Config[]` default export from `src/index.ts` — every later rule task appends config objects inside this function. Config objects are named `nuxt-conventions/<topic>`.

- [ ] **Step 1: Write package.json**

`packages/eslint-config-nuxt/package.json`:
```json
{
  "name": "@oleh-khomenko/eslint-config-nuxt",
  "version": "0.1.0",
  "description": "ESLint flat config enforcing Nuxt layer-architecture conventions (app/server/shared, api clients, services, naming)",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "prepublishOnly": "pnpm build && pnpm test"
  },
  "peerDependencies": {
    "eslint": ">=9"
  },
  "dependencies": {
    "eslint-plugin-check-file": "^3.3.0"
  },
  "devDependencies": {
    "@typescript-eslint/parser": "^8.35.0",
    "eslint": "^9.30.0",
    "eslint-plugin-import-x": "^4.16.0",
    "eslint-plugin-vue": "^10.3.0",
    "typescript": "^5.8.0",
    "vitest": "^3.2.0",
    "vue-eslint-parser": "^10.2.0"
  },
  "publishConfig": {
    "access": "public"
  },
  "license": "MIT"
}
```

- [ ] **Step 2: Write tsconfig and sources**

`packages/eslint-config-nuxt/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "declaration": true,
    "outDir": "dist",
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

`packages/eslint-config-nuxt/src/types.d.ts` (check-file ships no types):
```ts
declare module 'eslint-plugin-check-file' {
  import type { ESLint } from 'eslint'
  const plugin: ESLint.Plugin
  export default plugin
}
```

`packages/eslint-config-nuxt/src/index.ts`:
```ts
import type { Linter } from 'eslint'

export default function nuxtConventions(): Linter.Config[] {
  return []
}
```

- [ ] **Step 3: Write the smoke test**

`packages/eslint-config-nuxt/tests/factory.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import nuxtConventions from '../src/index'

describe('nuxtConventions', () => {
  it('returns an array of named config objects', () => {
    const configs = nuxtConventions()
    expect(Array.isArray(configs)).toBe(true)
    for (const config of configs) {
      expect(config.name).toMatch(/^nuxt-conventions\//)
    }
  })
})
```

- [ ] **Step 4: Install, build, test**

Run: `cd /Users/oleghomenko/custom-dev-tools && pnpm install && cd packages/eslint-config-nuxt && pnpm build && pnpm test`
Expected: build emits `dist/index.js` + `dist/index.d.ts`; 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Add eslint-config-nuxt package skeleton"
```

---

### Task 3: Layer boundary rules

**Files:**
- Modify: `packages/eslint-config-nuxt/src/index.ts`
- Create: `packages/eslint-config-nuxt/tests/helpers.ts`
- Test: `packages/eslint-config-nuxt/tests/boundaries.test.ts`

**Interfaces:**
- Consumes: `nuxtConventions()` from Task 2.
- Produces: test helper `lintCode(code: string, filePath: string): Promise<Linter.LintMessage[]>` — lints a virtual file at a repo-relative path with the full config; Tasks 4–5 reuse it.

- [ ] **Step 1: Write the test helper**

`packages/eslint-config-nuxt/tests/helpers.ts`:
```ts
import { ESLint, type Linter } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import vuePlugin from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import importX from 'eslint-plugin-import-x'
import nuxtConventions from '../src/index'

// Mimics the consumer environment: @nuxt/eslint registers the vue and
// import plugins and TS parsing; our factory only sets rules.
function baseConfig(): Linter.Config[] {
  return [
    {
      files: ['**/*.ts'],
      languageOptions: { parser: tsParser as Linter.Parser },
    },
    {
      files: ['**/*.vue'],
      languageOptions: {
        parser: vueParser as Linter.Parser,
        parserOptions: { parser: tsParser },
      },
      plugins: { vue: vuePlugin as never },
    },
    {
      files: ['**/*.{ts,vue}'],
      plugins: { import: importX as never },
    },
  ]
}

export async function lintCode(code: string, filePath: string): Promise<Linter.LintMessage[]> {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [...baseConfig(), ...nuxtConventions()],
  })
  const [result] = await eslint.lintText(code, { filePath })
  return result.messages
}

export function ruleIds(messages: Linter.LintMessage[]): (string | null)[] {
  return messages.map(m => m.ruleId)
}
```

- [ ] **Step 2: Write failing boundary tests**

`packages/eslint-config-nuxt/tests/boundaries.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { lintCode, ruleIds } from './helpers'

describe('layer boundaries', () => {
  it('forbids app/ importing from server/', async () => {
    const messages = await lintCode(
      "import { walletService } from '~~/server/services/wallet.service'\nexport const x = walletService\n",
      'app/stores/wallet.ts',
    )
    expect(ruleIds(messages)).toContain('no-restricted-imports')
  })

  it('forbids server/ importing from app/', async () => {
    const messages = await lintCode(
      "import { useForm } from '~/composables/use-form'\nexport const x = useForm\n",
      'server/api/wallet/index.get.ts',
    )
    expect(ruleIds(messages)).toContain('no-restricted-imports')
  })

  it('forbids shared/ importing from app/ or server/', async () => {
    const messages = await lintCode(
      "import { db } from '../../server/utils/db'\nexport const x = db\n",
      'shared/models/wallet/wallet.ts',
    )
    expect(ruleIds(messages)).toContain('no-restricted-imports')
  })

  it('allows app/ importing from shared/', async () => {
    const messages = await lintCode(
      "import { capitalize } from '~~/shared/helpers/capitalize'\nexport const x = capitalize\n",
      'app/stores/wallet.ts',
    )
    expect(ruleIds(messages)).not.toContain('no-restricted-imports')
  })

  it('forbids $fetch in components, stores, composables, pages', async () => {
    for (const filePath of [
      'app/stores/wallet.ts',
      'app/composables/use-wallet.ts',
    ]) {
      const messages = await lintCode(
        "export async function load() {\n  return await $fetch('/api/wallet')\n}\n",
        filePath,
      )
      expect(ruleIds(messages), filePath).toContain('no-restricted-syntax')
    }
  })

  it('allows $fetch in app/api client modules', async () => {
    const messages = await lintCode(
      "export function getWallet() {\n  return $fetch('/api/wallet')\n}\n",
      'app/api/wallet.api.ts',
    )
    expect(ruleIds(messages)).not.toContain('no-restricted-syntax')
  })

  it('forbids serverSupabase* outside server/services', async () => {
    const messages = await lintCode(
      "export default defineEventHandler(async (event) => {\n  const client = serverSupabaseClient(event)\n  return client\n})\n",
      'server/api/wallet/index.get.ts',
    )
    expect(ruleIds(messages)).toContain('no-restricted-syntax')
  })

  it('allows serverSupabase* in server/services', async () => {
    const messages = await lintCode(
      "export async function getWallet(event) {\n  return serverSupabaseClient(event)\n}\n",
      'server/services/wallet.service.ts',
    )
    expect(ruleIds(messages)).not.toContain('no-restricted-syntax')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd packages/eslint-config-nuxt && pnpm test`
Expected: FAIL — the forbid-tests get no `no-restricted-imports`/`no-restricted-syntax` messages (factory returns `[]`).

- [ ] **Step 4: Implement boundary configs**

Replace `packages/eslint-config-nuxt/src/index.ts` with:
```ts
import type { Linter } from 'eslint'

const HTTP_MESSAGE = 'HTTP calls live only in app/api/*.api.ts client modules.'
const DB_MESSAGE = 'Database access lives only in server/services/*.service.ts.'
const HTTP_CALLEES = ['$fetch', 'useFetch', 'useLazyFetch']

export default function nuxtConventions(): Linter.Config[] {
  return [
    {
      name: 'nuxt-conventions/app-no-server-imports',
      files: ['app/**/*.{ts,vue}'],
      rules: {
        'no-restricted-imports': ['error', {
          patterns: [{
            group: ['**/server/**'],
            message: 'app/ must not import from server/. Share code via shared/.',
          }],
        }],
      },
    },
    {
      name: 'nuxt-conventions/server-no-app-imports',
      files: ['server/**/*.ts'],
      rules: {
        'no-restricted-imports': ['error', {
          patterns: [{
            group: ['**/app/**', '~/**'],
            message: 'server/ must not import from app/. Share code via shared/.',
          }],
        }],
      },
    },
    {
      name: 'nuxt-conventions/shared-standalone',
      files: ['shared/**/*.ts'],
      rules: {
        'no-restricted-imports': ['error', {
          patterns: [{
            group: ['**/app/**', '**/server/**', '~/**', '~~/**', '#imports'],
            message: 'shared/ must not depend on app/ or server/.',
          }],
        }],
      },
    },
    {
      name: 'nuxt-conventions/http-only-in-api-client',
      files: [
        'app/components/**/*.{ts,vue}',
        'app/pages/**/*.vue',
        'app/layouts/**/*.vue',
        'app/stores/**/*.ts',
        'app/composables/**/*.ts',
      ],
      rules: {
        'no-restricted-syntax': [
          'error',
          ...HTTP_CALLEES.map(callee => ({
            selector: `CallExpression[callee.name='${callee}']`,
            message: HTTP_MESSAGE,
          })),
        ],
      },
    },
    {
      name: 'nuxt-conventions/db-only-in-services',
      files: ['server/**/*.ts'],
      ignores: ['server/services/**'],
      rules: {
        'no-restricted-syntax': ['error', {
          selector: 'CallExpression[callee.name=/^serverSupabase/]',
          message: DB_MESSAGE,
        }],
      },
    },
  ]
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS (factory test + 8 boundary tests).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Add layer boundary rules"
```

---

### Task 4: Filename convention rules

**Files:**
- Modify: `packages/eslint-config-nuxt/src/index.ts` (append one config object)
- Test: `packages/eslint-config-nuxt/tests/filenames.test.ts`

**Interfaces:**
- Consumes: `lintCode` helper from Task 3.
- Produces: config object `nuxt-conventions/filenames` registering the `check-file` plugin.

- [ ] **Step 1: Write failing filename tests**

`packages/eslint-config-nuxt/tests/filenames.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { lintCode, ruleIds } from './helpers'

const EMPTY = 'export {}\n'
const RULE = 'check-file/filename-naming-convention'

const failing = [
  'app/api/countries.ts',            // missing .api suffix
  'app/components/common/badButton.vue',
  'app/composables/formHelper.ts',   // not use-*
  'app/queries/message-cache.ts',    // missing .queries suffix
  'server/services/wallet.ts',       // missing .service suffix
  'app/stores/CallRoom.ts',          // not kebab-case
]

const passing = [
  'app/api/wallet.api.ts',
  'app/components/common/Button.vue',
  'app/composables/use-form.ts',
  'app/queries/messages.queries.ts',
  'server/services/wallet.service.ts',
  'app/stores/call-room.ts',
  'shared/types/database.types.ts',
  'server/api/wallet/index.get.ts',  // Nitro conventions untouched
]

describe('filename conventions', () => {
  for (const filePath of failing) {
    it(`flags ${filePath}`, async () => {
      expect(ruleIds(await lintCode(EMPTY, filePath))).toContain(RULE)
    })
  }
  for (const filePath of passing) {
    it(`accepts ${filePath}`, async () => {
      expect(ruleIds(await lintCode(EMPTY, filePath))).not.toContain(RULE)
    })
  }
})
```

- [ ] **Step 2: Run tests to verify the `flags` cases fail**

Run: `pnpm test`
Expected: FAIL — the six `flags ...` tests find no `check-file/...` messages.

- [ ] **Step 3: Implement the filenames config**

In `src/index.ts`, add the import at the top:
```ts
import checkFile from 'eslint-plugin-check-file'
```

Append to the returned array:
```ts
    {
      name: 'nuxt-conventions/filenames',
      files: ['app/**/*.{ts,vue}', 'server/**/*.ts', 'shared/**/*.ts'],
      plugins: { 'check-file': checkFile },
      rules: {
        'check-file/filename-naming-convention': ['error', {
          'app/components/**/*.vue': 'PASCAL_CASE',
          'app/composables/**/*.ts': 'use-+([a-z0-9-])',
          'app/api/**/*.ts': '+([a-z0-9-]).api',
          'app/queries/**/*.ts': '+([a-z0-9-]).queries',
          'app/stores/**/*.ts': 'KEBAB_CASE',
          'app/utils/**/*.ts': '+([a-z0-9.-])',
          'server/services/**/*.ts': '+([a-z0-9-]).service',
          'shared/**/*.ts': '+([a-z0-9.-])',
        }],
      },
    },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS (all filename cases). If `database.types.ts` fails: the `+([a-z0-9.-])` pattern must match dots — verify option `ignoreMiddleExtensions` is NOT set (we match the full basename minus final extension).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Add filename convention rules"
```

---

### Task 5: Vue and import-order rules

**Files:**
- Modify: `packages/eslint-config-nuxt/src/index.ts` (append two config objects)
- Test: `packages/eslint-config-nuxt/tests/vue-and-imports.test.ts`

**Interfaces:**
- Consumes: `lintCode` helper (its base config registers `vue` and `import` plugins, mimicking `@nuxt/eslint`).
- Produces: config objects `nuxt-conventions/vue` and `nuxt-conventions/import-order`. These set rule severities only — no plugin registration (consumer contract).

- [ ] **Step 1: Write failing tests**

`packages/eslint-config-nuxt/tests/vue-and-imports.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { lintCode, ruleIds } from './helpers'

describe('vue conventions', () => {
  it('requires script before template', async () => {
    const code = '<template>\n  <div />\n</template>\n<script setup lang="ts">\n</script>\n'
    expect(ruleIds(await lintCode(code, 'app/components/common/Card.vue'))).toContain('vue/block-order')
  })

  it('rejects Options API', async () => {
    const code = '<script lang="ts">\nexport default { name: "Card" }\n</script>\n<template>\n  <div />\n</template>\n'
    expect(ruleIds(await lintCode(code, 'app/components/common/Card.vue'))).toContain('vue/component-api-style')
  })

  it('accepts script-setup with trailing i18n block', async () => {
    const code = '<script setup lang="ts">\n</script>\n<template>\n  <div />\n</template>\n<i18n lang="json">\n{}\n</i18n>\n'
    const messages = await lintCode(code, 'app/components/common/Card.vue')
    expect(ruleIds(messages)).not.toContain('vue/block-order')
    expect(ruleIds(messages)).not.toContain('vue/component-api-style')
  })
})

describe('import order', () => {
  it('flags external imports after relative ones', async () => {
    const code = "import { helper } from './helper'\nimport { ref } from 'vue'\nexport const x = [helper, ref]\n"
    expect(ruleIds(await lintCode(code, 'shared/helpers/combine.ts'))).toContain('import/order')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — vue/import rules not configured yet.

- [ ] **Step 3: Implement the two config objects**

Append to the returned array in `src/index.ts`:
```ts
    {
      name: 'nuxt-conventions/vue',
      files: ['**/*.vue'],
      rules: {
        'vue/block-order': ['error', { order: ['script', 'template', 'style', 'i18n'] }],
        'vue/component-api-style': ['error', ['script-setup']],
        'vue/define-macros-order': ['error', { order: ['defineProps', 'defineEmits'] }],
        'vue/require-typed-ref': 'error',
        'vue/multi-word-component-names': 'off',
      },
    },
    {
      name: 'nuxt-conventions/import-order',
      files: ['**/*.{ts,vue}'],
      rules: {
        'import/order': ['error', {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'ignore',
        }],
      },
    },
```

- [ ] **Step 4: Run full suite and build**

Run: `pnpm build && pnpm test`
Expected: build clean; all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Add vue and import order rules"
```

---

### Task 6: Claude plugin — `nuxt-style-guide` skill

**Files:**
- Create: `plugins/nuxt-conventions/.claude-plugin/plugin.json`
- Create: `plugins/nuxt-conventions/skills/nuxt-style-guide/SKILL.md`

**Interfaces:**
- Produces: plugin `nuxt-conventions` v0.1.0; Task 8's marketplace manifest points at `./plugins/nuxt-conventions`.

- [ ] **Step 1: Write plugin.json**

`plugins/nuxt-conventions/.claude-plugin/plugin.json`:
```json
{
  "name": "nuxt-conventions",
  "version": "0.1.0",
  "description": "Nuxt layer-architecture conventions: style-guide skill and /nuxt-review command"
}
```

- [ ] **Step 2: Write SKILL.md**

`plugins/nuxt-conventions/skills/nuxt-style-guide/SKILL.md` — exact content:

````markdown
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
````

- [ ] **Step 3: Validate JSON and structure**

Run: `node -e "JSON.parse(require('fs').readFileSync('plugins/nuxt-conventions/.claude-plugin/plugin.json','utf8')); console.log('ok')"`
Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "Add nuxt-style-guide skill"
```

---

### Task 7: `/nuxt-review` command

**Files:**
- Create: `plugins/nuxt-conventions/commands/nuxt-review.md`

**Interfaces:**
- Consumes: conventions defined in the Task 6 skill (the command references it by name).

- [ ] **Step 1: Write the command**

`plugins/nuxt-conventions/commands/nuxt-review.md` — exact content:

````markdown
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
````

- [ ] **Step 2: Verify frontmatter parses**

Run: `head -3 plugins/nuxt-conventions/commands/nuxt-review.md`
Expected: `---` / `description: ...` / `---`.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "Add /nuxt-review command"
```

---

### Task 8: Marketplace manifest and READMEs

**Files:**
- Create: `.claude-plugin/marketplace.json`
- Create: `README.md`
- Create: `packages/eslint-config-nuxt/README.md`

**Interfaces:**
- Consumes: plugin from Task 6/7 at `./plugins/nuxt-conventions`; package name from Task 2.

- [ ] **Step 1: Write marketplace.json**

`.claude-plugin/marketplace.json`:
```json
{
  "name": "custom-dev-tools",
  "owner": {
    "name": "Oleh Khomenko"
  },
  "plugins": [
    {
      "name": "nuxt-conventions",
      "source": "./plugins/nuxt-conventions",
      "description": "Nuxt layer-architecture conventions: style-guide skill and /nuxt-review command"
    }
  ]
}
```

- [ ] **Step 2: Write root README.md**

`README.md`:
```markdown
# custom-dev-tools

Personal toolkit distilled from real Nuxt projects.

## Contents

- **`packages/eslint-config-nuxt`** — `@oleh-khomenko/eslint-config-nuxt`,
  ESLint flat config enforcing Nuxt layer-architecture conventions.
- **`plugins/nuxt-conventions`** — Claude Code plugin: `nuxt-style-guide`
  skill + `/nuxt-review` command.

## Install

ESLint config (in a Nuxt project):

    pnpm add -D @oleh-khomenko/eslint-config-nuxt

Claude plugin:

    /plugin marketplace add <git-url-of-this-repo>
    /plugin install nuxt-conventions@custom-dev-tools
```

- [ ] **Step 3: Write package README.md**

`packages/eslint-config-nuxt/README.md`:
````markdown
# @oleh-khomenko/eslint-config-nuxt

ESLint flat config enforcing Nuxt layer architecture:

- file naming per directory (`use-*.ts`, `*.api.ts`, `*.service.ts`, `PascalCase.vue`)
- layer boundaries: no `$fetch` outside `app/api/`, no DB access outside `server/services/`, no `app/` ↔ `server/` imports
- vue conventions: script-setup only, block order `script → template → style → i18n`
- import ordering

## Usage

Requires `@nuxt/eslint` (provides the vue and import plugins).

```js
// eslint.config.mjs
import withNuxt from './.nuxt/eslint.config.mjs'
import nuxtConventions from '@oleh-khomenko/eslint-config-nuxt'

export default withNuxt(...nuxtConventions())
```
````

- [ ] **Step 4: Validate marketplace JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json','utf8')); console.log('ok')"`
Expected: `ok`

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "Add marketplace manifest and readmes"
```

---

### Task 9: Verification against freelance-unity

**Files:**
- Create (scratch, not committed): `/private/tmp/claude-501/-Users-oleghomenko-event-invite-app/cb791d16-9f87-40b1-a970-ef5643eeab3d/scratchpad/fu-eslint.config.mjs`

**Interfaces:**
- Consumes: built `dist/index.js` from Task 5.

- [ ] **Step 1: Build and write a scratch config for the reference repo**

Run: `cd /Users/oleghomenko/custom-dev-tools/packages/eslint-config-nuxt && pnpm build`

Scratch config (vue/import-order objects excluded — the scratch run has no
vue/import plugins; they are covered by unit tests). A TS parser is required:
ESLint skips ALL rules (including filename rules) on files that fail to
parse, and the target files use TS syntax. Consumers get the parser from
`@nuxt/eslint`; the scratch run borrows it from the package's devDependencies:
```js
// fu-eslint.config.mjs
import tsParser from '/Users/oleghomenko/custom-dev-tools/node_modules/@typescript-eslint/parser/dist/index.js'
import nuxtConventions from '/Users/oleghomenko/custom-dev-tools/packages/eslint-config-nuxt/dist/index.js'

const skip = new Set(['nuxt-conventions/vue', 'nuxt-conventions/import-order'])
export default [
  { files: ['**/*.ts'], languageOptions: { parser: tsParser } },
  ...nuxtConventions().filter(c => !skip.has(c.name)),
]
```

- [ ] **Step 2: Run against freelance-unity's ts sources**

Run:
```bash
cd /Users/oleghomenko/freelance-unity && npx eslint \
  --no-config-lookup \
  --config /private/tmp/claude-501/-Users-oleghomenko-event-invite-app/cb791d16-9f87-40b1-a970-ef5643eeab3d/scratchpad/fu-eslint.config.mjs \
  "app/api/**/*.ts" "app/queries/**/*.ts" "server/services/**/*.ts" || true
```
Expected: exits with violations, including `app/api/countries.ts` (filename: missing `.api` suffix) and `app/queries/message-cache.ts` (missing `.queries` suffix). No parse errors (the scratch config provides the TS parser).

- [ ] **Step 3: Confirm conforming files stay clean**

In the same output verify `app/api/wallet.api.ts` and `server/services/wallet.service.ts` produce no `check-file` or boundary messages (services legitimately call `serverSupabase*`).

- [ ] **Step 4: Record result**

If both expectations hold, append a `## Verification` line to the plan noting the date and the two findings, then commit:
```bash
cd /Users/oleghomenko/custom-dev-tools && git add -A && git commit -m "Record verification against reference repo"
```

---

## Verification

2026-07-16: Ran the built package against freelance-unity (Task 9). Confirmed: `app/api/countries.ts` flagged for missing `.api` suffix and `app/queries/message-cache.ts` flagged for missing `.queries` suffix; `app/api/wallet.api.ts` and `server/services/wallet.service.ts` stayed clean; no parse errors.

## Not in this plan (manual follow-ups)

- `npm publish` (requires npm login/OTP) — run `pnpm publish` in
  `packages/eslint-config-nuxt` when ready; `prepublishOnly` gates it with
  build + tests.
- Pushing the repo to a git host and installing the plugin from its URL.
