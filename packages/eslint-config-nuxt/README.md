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

### Stylistic requirement

`@stylistic/member-delimiter-style` requires the consumer to enable
`@nuxt/eslint`'s stylistic feature in `nuxt.config.ts`:
`eslint: { config: { stylistic: true } }`. Without it ESLint will error
that the rule is undefined — that loud failure is intentional (don't
silently skip it).
