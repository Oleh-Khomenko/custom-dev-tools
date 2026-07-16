import { describe, expect, it } from 'vitest'
import { lintCode, ruleIds } from './helpers'

describe('vue conventions', () => {
  it('requires script before template', async () => {
    const code = '<template>\n  <div />\n</template>\n<script setup lang="ts">\n</script>\n'
    expect(ruleIds(await lintCode(code, 'app/components/common/Card.vue'))).toContain('vue/block-order')
  })

  it('rejects Options API', async () => {
    const code = '<script lang="ts">\nexport default { name: "Card", data() { return {} } }\n</script>\n<template>\n  <div />\n</template>\n'
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
