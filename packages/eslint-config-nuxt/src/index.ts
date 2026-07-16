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
  ]
}
