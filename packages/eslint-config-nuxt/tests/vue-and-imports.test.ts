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

  it('flags runtime defineProps', async () => {
    const code = '<script setup lang="ts">\ndefineProps({ foo: String })\n</script>\n<template>\n  <div />\n</template>\n'
    expect(ruleIds(await lintCode(code, 'app/components/common/Card.vue'))).toContain('vue/define-props-declaration')
  })

  it('accepts type-based defineProps', async () => {
    const code = '<script setup lang="ts">\ndefineProps<{ foo: string }>()\n</script>\n<template>\n  <div />\n</template>\n'
    const messages = await lintCode(code, 'app/components/common/Card.vue')
    expect(ruleIds(messages)).not.toContain('vue/define-props-declaration')
  })

  it('flags a non-self-closed empty component', async () => {
    const code = '<script setup lang="ts">\n</script>\n<template>\n  <Foo></Foo>\n</template>\n'
    expect(ruleIds(await lintCode(code, 'app/components/common/Card.vue'))).toContain('vue/html-self-closing')
  })

  it('accepts a self-closed empty component', async () => {
    const code = '<script setup lang="ts">\n</script>\n<template>\n  <Foo />\n</template>\n'
    const messages = await lintCode(code, 'app/components/common/Card.vue')
    expect(ruleIds(messages)).not.toContain('vue/html-self-closing')
  })

  it('flags a camelCase attribute binding', async () => {
    const code = '<script setup lang="ts">\nconst x = 1\n</script>\n<template>\n  <Foo :myProp="x" />\n</template>\n'
    expect(ruleIds(await lintCode(code, 'app/components/common/Card.vue'))).toContain('vue/attribute-hyphenation')
  })

  it('accepts a hyphenated attribute binding', async () => {
    const code = '<script setup lang="ts">\nconst x = 1\n</script>\n<template>\n  <Foo :my-prop="x" />\n</template>\n'
    const messages = await lintCode(code, 'app/components/common/Card.vue')
    expect(ruleIds(messages)).not.toContain('vue/attribute-hyphenation')
  })

  it('flags a camelCase v-on event', async () => {
    const code = '<script setup lang="ts">\nfunction f() {}\n</script>\n<template>\n  <Foo @myEvent="f" />\n</template>\n'
    expect(ruleIds(await lintCode(code, 'app/components/common/Card.vue'))).toContain('vue/v-on-event-hyphenation')
  })

  it('accepts a hyphenated v-on event', async () => {
    const code = '<script setup lang="ts">\nfunction f() {}\n</script>\n<template>\n  <Foo @my-event="f" />\n</template>\n'
    const messages = await lintCode(code, 'app/components/common/Card.vue')
    expect(ruleIds(messages)).not.toContain('vue/v-on-event-hyphenation')
  })

  it('flags an event listed before a static attribute', async () => {
    const code = '<script setup lang="ts">\nfunction x() {}\n</script>\n<template>\n  <div @click="x" class="y" />\n</template>\n'
    expect(ruleIds(await lintCode(code, 'app/components/common/Card.vue'))).toContain('vue/attributes-order')
  })

  it('accepts a static attribute before an event', async () => {
    const code = '<script setup lang="ts">\nfunction x() {}\n</script>\n<template>\n  <div class="y" @click="x" />\n</template>\n'
    const messages = await lintCode(code, 'app/components/common/Card.vue')
    expect(ruleIds(messages)).not.toContain('vue/attributes-order')
  })

  it('flags runtime/array defineEmits', async () => {
    const code = '<script setup lang="ts">\nconst emit = defineEmits([\'close\'])\n</script>\n<template>\n  <div />\n</template>\n'
    expect(ruleIds(await lintCode(code, 'app/components/common/Card.vue'))).toContain('vue/define-emits-declaration')
  })

  it('accepts type-based defineEmits', async () => {
    const code = '<script setup lang="ts">\nconst emit = defineEmits<{ close: [] }>()\n</script>\n<template>\n  <div />\n</template>\n'
    const messages = await lintCode(code, 'app/components/common/Card.vue')
    expect(ruleIds(messages)).not.toContain('vue/define-emits-declaration')
  })

  it('flags an emitted event not declared in defineEmits', async () => {
    const code = '<script setup lang="ts">\nconst emit = defineEmits<{ close: [] }>()\n</script>\n<template>\n  <div @click="$emit(\'open\')" />\n</template>\n'
    expect(ruleIds(await lintCode(code, 'app/components/common/Card.vue'))).toContain('vue/require-explicit-emits')
  })

  it('accepts an emitted event declared in defineEmits', async () => {
    const code = '<script setup lang="ts">\nconst emit = defineEmits<{ close: [] }>()\n</script>\n<template>\n  <div @click="$emit(\'close\')" />\n</template>\n'
    const messages = await lintCode(code, 'app/components/common/Card.vue')
    expect(ruleIds(messages)).not.toContain('vue/require-explicit-emits')
  })
})

describe('import order', () => {
  it('flags external imports after relative ones', async () => {
    const code = "import { helper } from './helper'\nimport { ref } from 'vue'\nexport const x = [helper, ref]\n"
    expect(ruleIds(await lintCode(code, 'shared/helpers/combine.ts'))).toContain('import/order')
  })

  it('flags duplicate imports from the same module', async () => {
    const code = "import { a } from './x'\nimport { b } from './x'\nexport const y = [a, b]\n"
    expect(ruleIds(await lintCode(code, 'shared/helpers/combine.ts'))).toContain('import/no-duplicates')
  })

  it('flags a relative import placed before an aliased ~/ import (pathGroups)', async () => {
    const code = "import { helper } from './helper'\nimport { useForm } from '~/composables/use-form'\nexport const x = [helper, useForm]\n"
    expect(ruleIds(await lintCode(code, 'misc/combine.ts'))).toContain('import/order')
  })

  it('accepts an aliased ~/ import placed before a relative import (pathGroups)', async () => {
    const code = "import { useForm } from '~/composables/use-form'\nimport { helper } from './helper'\nexport const x = [helper, useForm]\n"
    const messages = await lintCode(code, 'misc/combine.ts')
    expect(ruleIds(messages)).not.toContain('import/order')
  })
})
