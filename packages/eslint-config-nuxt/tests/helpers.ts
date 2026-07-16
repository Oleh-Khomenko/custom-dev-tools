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
