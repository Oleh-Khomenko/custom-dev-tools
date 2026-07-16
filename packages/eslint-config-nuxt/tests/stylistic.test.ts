import { describe, expect, it } from 'vitest'
import { lintCode, ruleIds } from './helpers'

describe('stylistic conventions', () => {
  it('flags comma delimiters in an interface', async () => {
    const messages = await lintCode(
      'interface P { a: number, b: string }\n',
      'shared/models/p.ts',
    )
    expect(ruleIds(messages)).toContain('@stylistic/member-delimiter-style')
  })

  it('accepts semicolon delimiters in an interface', async () => {
    const messages = await lintCode(
      'interface P { a: number; b: string }\n',
      'shared/models/p.ts',
    )
    expect(ruleIds(messages)).not.toContain('@stylistic/member-delimiter-style')
  })
})
