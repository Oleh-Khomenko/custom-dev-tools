# Nuxt Conventions — Conformance Criteria

Distilled from a meticulous read of the reference project `freelance-unity` (Nuxt 4, Vue 3, Pinia, TanStack Query, Supabase, Valibot, SCSS, `@nuxtjs/i18n`). Each criterion states the **rule**; where the reference is internally inconsistent, the rule is the **idealized decision** (pick-one), not a copy of the drift.

Legend: ⚙️ = machine-enforceable (ESLint/formatter). ✅ = already enforced by `@oleh-khomenko/eslint-config-nuxt`. ◻️ = enforceable but not yet in the package. 👁️ = judgment (skill / `/nuxt-review` only).

---

## A. File & directory structure

- ✅ Canonical `app/` / `server/` / `shared/` split.
- 👁️ **One type per file** in `shared/models/**`; filename = kebab-case of the PascalCase export (`message.ts` → `Message`). Multi-export only for tightly-coupled shapes of one external contract (e.g. an SFU API surface) — and such a file must be named for the group, not a single type.
- ✅ Enums live **only** under `shared/models/**` with the `.enum.ts` suffix; never in `shared/constants/**`.
- 👁️ Domain-first grouping: `shared/models/<domain>/`, `server/api/<resource>/`, `app/components/page-components/<feature>/`. `common/` may nest (`common/list/`, `common/validation/`).
- 👁️ **No barrel `index.ts`** in `shared/**` — imports are fully qualified via the `#shared/*` alias. (Reference does this deliberately; keep it.)
- 👁️ Feature modal lives in its feature dir, not a global `modals/`.
- 👁️ Composables grouped by domain subfolder (`app/composables/<domain>/use-*.ts`) — an idealized fix; the reference keeps them flat.
- 👁️ No orphan/stale files. The reference carries two anti-examples to avoid: a duplicated stale `app/types/database.types.ts` (canonical is `shared/types/database.types.ts`) and a misnamed `KycStepper.vue`. Generated DB types have exactly one home: `shared/types/database.types.ts`.

## B. Import ordering  ⚙️

The reference relies on convention only (no lint rule); the idealized guide **enforces** it.

- ✅ Group order: external/builtin → internal aliases (`~/`, `#shared`, `#imports`) → parent → sibling → index.
- 👁️ Within a file, imports are visually grouped by **semantic role** with lowercase `// section` banners, blank line between groups. Canonical order of banners:
  - client: (external, unlabeled) → `// utils` → `// composables` → `// queries` → `// api` → `// components` → `// stores` → `// models` → `// constants`.
  - server: (external, unlabeled) → `// services` → `// schemas` → `// models` → `// constants`.
  - shared: (external, unlabeled) → `// models` → `// constants`.
- ◻️ **`import type`** for every type-only import, kept distinct from value imports (reference is ~50/50 — normalize to always-`import type`).
- 👁️ One alias per target: **`~/`** for app-local, **`#shared`** for shared, **`~~/`**/`@/` avoided. (Reference mixes `~/` and `@/` — standardize on `~/`.)
- 👁️ Place a shared enum used as a localized message (`ServerMessageTypes`) under `// models`, consistently (reference files disagree).

## C. Comments  👁️

- **Structural section banners** are the primary comment: a fixed lowercase vocabulary marking file regions (`// props`, `// emits`, `// common`, `// computed`, `// helpers`, `// watchers`, `// lifecycle`, `// expose`; import-group labels from §B). One concept = one label — normalize the reference's synonyms: use `// refs` (not `// state`), `// lifecycle` (not `// lifecycle hooks`), `// stores` (not `// store`).
- **"Why" comments** only for non-obvious cross-file coupling, magic numbers, workarounds, or security intent (e.g. a magic `LINE_HEIGHT_PX` that must track SCSS, or "return the same generic error regardless of failure reason").
- **No JSDoc** in general code; short one-line `//` doc above an exported function is acceptable for non-obvious service functions. (Reserve `/** */` for genuinely public API surfaces.)
- ◻️ **No commented-out / dead code** committed (reference tolerates it — forbid it; `no-warning-comments` / manual review).
- No file-header/license comments.

## D. Naming

- ✅ Files: `PascalCase.vue`; `use-kebab.ts`; `*.api.ts`; `*.queries.ts`; `*.service.ts`; `*.enum.ts`; `*.schema.ts`; `kebab.ts` for stores/utils/helpers/models; Nitro route names (`index.get.ts`, `[id].patch.ts`, `[...path].ts`) untouched.
- 👁️ Functions: verb-phrase camelCase (`getWalletBalance`, `toggleLike`). Assertion helpers `assert*` (return `void`, throw); fatal error helpers `throw*` typed `(...): never`; row→DTO mappers `map<Entity>` (`map<Entity>FromJson` when source is RPC JSON).
- 👁️ Enums: PascalCase type, PascalCase members, `.enum.ts` file.
- 👁️ Valibot: `const V<Name>Schema` default-exported + `export type <Name>Dto = v.InferOutput<typeof V<Name>Schema>` in the same file. (Normalize the lone `UserData` exception to `<Name>Dto`.)
- 👁️ Constants: `UPPER_SNAKE_CASE`, one `export const` per value. Lookup-map object constants are also `UPPER_SNAKE_CASE` (reference drifts to PascalCase like `ComponentsMap` — normalize to SCREAMING_SNAKE).
- 👁️ Booleans prefixed `is`/`has`/`can`/`show`. Template event handlers `handleX`; `onX` reserved for native window/document listeners.
- 👁️ No magic numbers repeated across files — hoist to a named constant (reference repeats password `maxLength(128)` 3×, `pageSize` shapes 3×).

## E. Vue SFC anatomy

- ✅ `<script setup lang="ts">` only (Options API forbidden).
- ✅/👁️ Top-level block order **`script → template → style → i18n`**. (Reference mixes style/i18n order — fix to style-before-i18n; ESLint `vue/block-order` enforces the primary order.)
- 👁️ `<script setup>` statement order: imports → `// custom models` (local `interface Props`/`Emits`/types) → `// custom constants` → `// props` (`withDefaults(defineProps<Props>(), {…})`) → `// emits` (`defineEmits<Emits>()`) → `// models` (`defineModel`) → `// common` (composables/stores/i18n) → `// template refs` (`useTemplateRef`) → `// refs` → `// computed` → `// watchers` → `// helpers` → `// lifecycle` → `// expose`. Normalize the reference's drift: **props before emits**, **template refs before refs**.
- 👁️ Props via named local `interface Props` + `defineProps<Props>()` (+ `withDefaults`); never destructure `props` in `<script>`. ◻️ member separator: pick **semicolons** (reference ~50/50).
- 👁️ Emits via call-signature `interface Emits { (e: 'x'): void }`; emit names kebab-case, positional payloads.
- 👁️ `defineModel<T>()` for v-model — not manual `modelValue` prop + `update:modelValue` emit.
- 👁️ Template refs via `useTemplateRef<T>('name')`, not `ref(null)` + `ref="…"`.
- 👁️ `defineExpose` only on focusable/imperative leaf components; expose functions over raw refs.
- 👁️ Template: attribute order `ref → static attrs → v-if/v-for → :bound → @events`; object `:class` for conditionals, array+object for mixed; DOM events lowercase, component events kebab-case; prefer event modifiers (`.stop`/`.self`) over manual calls; `v-for` always keyed by stable id; slots with fallback content. ◻️ self-close void elements consistently.

## F. Client layer

- 👁️ **Composables**: `export default function useX(...): ReturnType {…}` (named function, explicit return type via a declared `ReturnType`-shaped interface). Body uses section banners; returns a plain object of refs/computed/functions. Module-scope caches allowed when documented.
- 👁️ **Stores**: `defineStore('kebab', () => {…})` setup syntax only; two-step `const useXStore = defineStore(…); export default useXStore;` (normalize `toast.ts`'s inline form). Cross-store composition inside the setup body. Persist via `useCookie`.
- 👁️ **Queries** (`*.queries.ts`, TanStack): exported `useXQuery`/`useXMutation`; query keys from a **shared key constant/builder** (reference redefines `CONVERSATIONS_KEY` in two files — centralize). Pure cache-manipulation helpers in a dedicated `message-cache.ts`-style module. Mutations use explicit 4-generic `useMutation<TData,TError,TVars,TContext>` with `*Vars`/`*Context` interfaces; `onError` → `toastStore.showError(getApiErrorMessage(err, t))`.
- ✅/👁️ **API clients** (`*.api.ts`): object of `async` methods with explicit `Promise<T>`, `export default XApi`. **All HTTP lives here** (ESLint bans `$fetch`/`useFetch` elsewhere). Inject `fetchFn: $Fetch = $fetch` for SSR-cookie-aware GETs; plain `$fetch` for mutations. Use ofetch `query:` (not `params:`), drop falsy params via `?? undefined`. Centralize the `useRequestFetch() as $Fetch` helper (reference duplicates it).
- 👁️ **Utils**: single default-exported pure function; `export default function foo(){}` form (normalize the 50/50 split).
- 👁️ **Plugins/middleware**: env encoded in filename (`*.client.ts`/`*.server.ts`/`.global.ts`). Type route params properly (avoid `to: any`).

## G. Server layer

- 👁️ **Route handlers** are thin; fixed operation order: rate-limit (`enforceRateLimit`) → auth (`requireAuth`/`requireRole`) → param extraction + UUID guard → body/query validation (`getValidatedObject(Schema, …)`) → get client (`serverSupabaseClient`|`serverSupabaseServiceRole`) → single service call → return. Write-only actions return `{ success: true }` (◻️ give this a shared `SuccessResponse` type). No business logic or raw DB queries in handlers (reference breaks this in `calls/*` — don't).
- ✅/👁️ **Services** (`*.service.ts`): plain exported `async` functions (never classes), `supabase` as first arg (or in an options object for many params); never touch `event`. Business-critical mutations via Postgres RPC; direct `.from()` for simple reads. Explicit `Promise<T>` with `T` a `shared/models` type — DB row types never leak past a `map*` function. ✅ DB access (`serverSupabaseClient`/`serverSupabaseServiceRole`) only in services.
- 👁️ Auth via `server/utils/require-auth.ts` (`requireAuth` → narrowed `AuthUser`) and `require-role.ts` (`requireRole(event, UserRoles[])`); `serverSupabaseUser`/`serverSupabaseSession` are auth helpers, allowed anywhere (ESLint selector must NOT flag them — already narrowed to Client/ServiceRole).
- 👁️ Errors: `throw createError({ statusCode, message: ServerMessageTypes.X })` — `message` is **always** a `ServerMessageTypes` enum member (localization contract), never a raw string. Purposeful status codes (400/401/403/404/409/429/500/502). ◻️ Centralize the duplicated RPC-error-map + `throw*Error` helper into a generic `mapPostgrestError(map, error)`.
- 👁️ Validation: Valibot schema from `shared/models/dto-validation/**` applied via `getValidatedObject`. Extract the copy-pasted route-param UUID guard into a shared `requireUuidParam(event, 'id')` util; give `page`/`pageSize` a shared query schema instead of manual `Number()` clamping in three places.

## H. Shared models, validation & i18n

- 👁️ `interface` by default; `type` for unions/mapped/primitive-union types. Reuse enums instead of re-deriving their values as raw literal unions (reference drifts in `Participant.role`).
- 👁️ Valibot: one schema per DTO, every validator takes a `ValidationMessages` enum member (never a literal); `v.InferOutput` always (never `InferInput`); schemas shared **unmodified** between client (`useForm`/`useValidatableRef`) and server (`getValidatedObject`). Centralize repeated field factories (`uuidField()`).
- 👁️ Constants: `UPPER_SNAKE_CASE` flat primitives, grouped by `// section` banners within a domain file. No enums here.
- 👁️ i18n: `defaultLocale: 'uk'`, `strategy: 'prefix_except_default'`. Locale files are **flat dictionaries keyed 1:1 to enum members**, typed via one idiom — pick `{ [k in Enum]: string }` **or** `Record<Enum, string>` and use it everywhere (reference mixes both; never `any`). `en`/`uk` mirror key-for-key with matching section comments. Component-local UI copy goes in a `<i18n lang="json">` block with `en`+`uk`; server/validation messages go in global `i18n/locales/**`. Never hardcode user-facing strings.
- ✅ `shared/**` imports nothing from `app/**` or `server/**`.

## I. Styling (SCSS)

- 👁️ Flat partials by concern: `_colors` (raw palette tokens, no semantics) → `_variables` (Sass `$` breakpoints/fonts) → `_themes` (semantic `--color-<category>-<role>-<state>` tokens under `.theme-light`/`.theme-dark`) → `_typography` (mixins) → `_mixins` → `_reset` → `index`. Motion/z-index tokens belong in a tokens file, not stranded in `index.scss` (reference strands them).
- 👁️ Components use `<style scoped lang="scss">`; **all** colors via `var(--color-*)`, **all** type via `@include typography.typo-*` mixins — no hardcoded hex/font-size (except JS chart configs that can't read CSS vars).
- 👁️ `@use '~/assets/styles/typography';` **namespaced** (not `as *`), path via `~/`. Class names kebab-case, scoping via Vue `scoped` (not BEM `__`/`--`); modifiers as `&.modifier`. `v-bind()` in SCSS for prop-driven values. Guard animations with `prefers-reduced-motion`.
- 👁️ Token hygiene: no typos baked into public custom-property names (reference ships `--color-main-gradiend`); verify `font-weight` values match their mixin names.

## J. TypeScript

- ◻️ `import type` for type-only imports; explicit return types on exported/internal functions.
- 👁️ No classes in app/shared/server domain code — interfaces, type aliases, enums, plain functions/objects. `as const` tuples feeding `v.picklist`. Generics with default params (`Option<T = string>`). Discriminated unions with a real shared discriminant. Minimize `any` at error/route boundaries (type them).
- 👁️ tsconfig `strict: true`; `target` ≥ ES2020 (reference uses `ESNext`) so `async`/`Promise` compile — **this is the standing guard against TS2705** (async in ES5 needs the Promise ctor / ES2015+ lib).

## K. Tests

- 👁️ **Mirror the source structure** (`tests/server/…`, `tests/composables/…`) or colocate — not a flat `tests/` bag (reference is flat; fix it).
- 👁️ Separate **pure unit** tests (import the function, no mocks, in/out) from **live integration** tests (real server + Supabase) by directory and naming — the flat mix hides millisecond tests among network tests.
- 👁️ `describe('<fn | METHOD /api/path>', …)` + `it('<present-tense behavior, no "should">', …)`; `beforeAll`/`afterAll` for setup/cleanup; track created ids and clean up.
- ◻️ Share test helpers (`api()`, admin clients, cookie building) in `tests/helpers.ts` — reference reimplements them per file. Import via aliases, not `../../`.
- ✅ ESM; vitest.

## L. Build, config & tooling

- ✅/👁️ `eslint.config.mjs` = `withNuxt(...nuxtConventions())` — **not** the empty passthrough the reference ships. Add a `lint` npm script (reference has none despite the dep).
- 👁️ **CI required**: lint + typecheck (`vue-tsc --noEmit`) + test on every push. The reference has an **empty** `.github/workflows/` — the idealized guide mandates a real gate.
- 👁️ `nuxt.config.ts` organized by `// section` banners. Security headers have a **single** source (reference splits them between `nitro.routeRules` and `public/_headers`).
- 👁️ `"type": "module"`, `strict`, `compatibilityVersion: 4`.

## M. YAGNI / anti-duplication (the `/nuxt-review` over-engineering lens)

Run the ladder before new code: needed? → already a composable/util/service? → Nuxt/Vue/VueUse native? → a `common/` component? → an installed dep? → else minimal. Never lazy about validation, auth, data-loss, accessibility.

Concrete duplications the reference accumulated — flag these shapes:
- `getRequestFetch()` / `useRequestFetch() as $Fetch` copied across queries & composables → one helper.
- `uuidField()` Valibot factory duplicated across schemas → one shared factory.
- RPC error-map + `throw*Error` duplicated per service → one generic mapper.
- `page`/`pageSize` query parsing hand-rolled in 3 handlers → one shared schema/util.
- Route-param UUID guard copy-pasted in ~9 handlers → `requireUuidParam`.
- Per-file test helpers → shared `tests/helpers.ts`.
- Stale duplicate generated types (`app/types/database.types.ts`) → delete; single source in `shared/types`.
