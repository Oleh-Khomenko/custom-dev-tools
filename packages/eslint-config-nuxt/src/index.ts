import type { Linter } from 'eslint'
import checkFile from 'eslint-plugin-check-file'

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
            group: ['**/app/**', '**/server/**', '~/**', '~~/**', '!~~/shared', '!~~/shared/**', '#imports'],
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
          selector: 'CallExpression[callee.name=/^serverSupabase(Client|ServiceRole)$/]',
          message: DB_MESSAGE,
        }],
      },
    },
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
    {
      name: 'nuxt-conventions/vue',
      files: ['**/*.vue'],
      rules: {
        'vue/block-order': ['error', { order: ['script', 'template', 'style', 'i18n'] }],
        'vue/component-api-style': ['error', ['script-setup']],
        'vue/define-macros-order': ['error', { order: ['defineProps', 'defineEmits'] }],
        'vue/require-typed-ref': 'error',
        'vue/multi-word-component-names': 'off',
        'vue/define-props-declaration': ['error', 'type-based'],
        'vue/define-emits-declaration': ['error', 'type-based'],
        'vue/require-explicit-emits': 'error',
        'vue/html-self-closing': ['error', { html: { void: 'always', normal: 'always', component: 'always' } }],
        'vue/attribute-hyphenation': ['error', 'always'],
        'vue/v-on-event-hyphenation': ['error', 'always'],
        'vue/attributes-order': ['error', { alphabetical: false, order: [
          'CONTENT',              // v-html / v-text — defines whole component content, FIRST
          'DEFINITION',           // is, v-is
          'LIST_RENDERING',       // v-for
          'CONDITIONALS',         // v-if / v-else / v-show
          'RENDER_MODIFIERS',     // v-pre / v-once
          'OTHER_DIRECTIVES',     // custom v-*
          'ATTR_SHORTHAND_BOOL',  // boolProp shorthand
          'GLOBAL',               // id
          'ATTR_STATIC',          // class="", type=""
          'UNIQUE',               // ref, key
          'SLOT',                 // v-slot
          'TWO_WAY_BINDING',      // v-model
          'ATTR_DYNAMIC',         // :foo
          'EVENTS',               // @click
        ] }],
      },
    },
    {
      name: 'nuxt-conventions/import-order',
      files: ['**/*.{ts,vue}'],
      rules: {
        'import/no-duplicates': 'error',
        'import/order': ['error', {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            { pattern: '#imports', group: 'internal', position: 'before' },
            { pattern: '#shared/**', group: 'internal', position: 'before' },
            { pattern: '~/**', group: 'internal' },
            { pattern: '~~/**', group: 'internal' },
          ],
          pathGroupsExcludedImportTypes: ['type'],
          'newlines-between': 'ignore',
        }],
      },
    },
    {
      name: 'nuxt-conventions/typescript',
      files: ['**/*.{ts,vue}'],
      rules: {
        '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'separate-type-imports' }],
        '@typescript-eslint/no-explicit-any': 'error',
      },
    },
    {
      name: 'nuxt-conventions/stylistic',
      files: ['**/*.{ts,vue}'],
      rules: {
        '@stylistic/member-delimiter-style': ['error', {
          multiline: { delimiter: 'semi', requireLast: true },
          singleline: { delimiter: 'semi', requireLast: false },
        }],
      },
    },
  ]
}
