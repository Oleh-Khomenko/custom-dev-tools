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

### Required `@nuxt/eslint` features

Enable both the `stylistic` and `typescript` features in `nuxt.config.ts`:

```ts
eslint: { config: { stylistic: true, typescript: true } }
```

`@nuxt/eslint` registers `vue`, `import` and (with `stylistic`) `@stylistic`
by default, but registers the `@typescript-eslint` plugin only when the
`typescript` feature is on. Without these, ESLint errors that
`@typescript-eslint/*` and `@stylistic/member-delimiter-style` are
undefined — that loud failure is intentional (don't silently skip it).
