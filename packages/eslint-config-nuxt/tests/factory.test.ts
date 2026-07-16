import { describe, expect, it } from 'vitest'
import nuxtConventions from '../src/index'

describe('nuxtConventions', () => {
  it('returns an array of named config objects', () => {
    const configs = nuxtConventions()
    expect(Array.isArray(configs)).toBe(true)
    for (const config of configs) {
      expect(config.name).toMatch(/^nuxt-conventions\//)
    }
  })
})
