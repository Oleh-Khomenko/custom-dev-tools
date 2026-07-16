import { describe, expect, it } from 'vitest'
import { lintCode, ruleIds } from './helpers'

describe('typescript conventions', () => {
  it('flags a type-only import used as a value import', async () => {
    const messages = await lintCode(
      "import { Foo } from './x'\nlet a: Foo\n",
      'shared/models/foo.ts',
    )
    expect(ruleIds(messages)).toContain('@typescript-eslint/consistent-type-imports')
  })

  it('does not force type-imports for an enum used as a value', async () => {
    const messages = await lintCode(
      "import Roles from './roles'\nconst x = Roles.Admin\n",
      'shared/models/roles.ts',
    )
    expect(ruleIds(messages)).not.toContain('@typescript-eslint/consistent-type-imports')
  })

  it('flags explicit any', async () => {
    const messages = await lintCode(
      'const x: any = 1\n',
      'shared/models/any.ts',
    )
    expect(ruleIds(messages)).toContain('@typescript-eslint/no-explicit-any')
  })
})
