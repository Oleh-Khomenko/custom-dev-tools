import { describe, expect, it } from 'vitest'
import { lintCode, ruleIds } from './helpers'

const EMPTY = 'export {}\n'
const RULE = 'check-file/filename-naming-convention'

const failing = [
  'app/api/countries.ts',            // missing .api suffix
  'app/components/common/badButton.vue',
  'app/composables/formHelper.ts',   // not use-*
  'app/queries/message-cache.ts',    // missing .queries suffix
  'server/services/wallet.ts',       // missing .service suffix
  'app/stores/CallRoom.ts',          // not kebab-case
]

const passing = [
  'app/api/wallet.api.ts',
  'app/components/common/Button.vue',
  'app/composables/use-form.ts',
  'app/queries/messages.queries.ts',
  'server/services/wallet.service.ts',
  'app/stores/call-room.ts',
  'shared/types/database.types.ts',
  'server/api/wallet/index.get.ts',  // Nitro conventions untouched
]

describe('filename conventions', () => {
  for (const filePath of failing) {
    it(`flags ${filePath}`, async () => {
      expect(ruleIds(await lintCode(EMPTY, filePath))).toContain(RULE)
    })
  }
  for (const filePath of passing) {
    it(`accepts ${filePath}`, async () => {
      expect(ruleIds(await lintCode(EMPTY, filePath))).not.toContain(RULE)
    })
  }
})
