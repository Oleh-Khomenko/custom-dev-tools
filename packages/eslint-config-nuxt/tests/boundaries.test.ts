import { describe, expect, it } from 'vitest'
import { lintCode, ruleIds } from './helpers'

describe('layer boundaries', () => {
  it('forbids app/ importing from server/', async () => {
    const messages = await lintCode(
      "import { walletService } from '~~/server/services/wallet.service'\nexport const x = walletService\n",
      'app/stores/wallet.ts',
    )
    expect(ruleIds(messages)).toContain('no-restricted-imports')
  })

  it('forbids server/ importing from app/', async () => {
    const messages = await lintCode(
      "import { useForm } from '~/composables/use-form'\nexport const x = useForm\n",
      'server/api/wallet/index.get.ts',
    )
    expect(ruleIds(messages)).toContain('no-restricted-imports')
  })

  it('forbids shared/ importing from app/ or server/', async () => {
    const messages = await lintCode(
      "import { db } from '../../server/utils/db'\nexport const x = db\n",
      'shared/models/wallet/wallet.ts',
    )
    expect(ruleIds(messages)).toContain('no-restricted-imports')
  })

  it('allows app/ importing from shared/', async () => {
    const messages = await lintCode(
      "import { capitalize } from '~~/shared/helpers/capitalize'\nexport const x = capitalize\n",
      'app/stores/wallet.ts',
    )
    expect(ruleIds(messages)).not.toContain('no-restricted-imports')
  })

  it('forbids $fetch in components, stores, composables, pages', async () => {
    for (const filePath of [
      'app/stores/wallet.ts',
      'app/composables/use-wallet.ts',
    ]) {
      const messages = await lintCode(
        "export async function load() {\n  return await $fetch('/api/wallet')\n}\n",
        filePath,
      )
      expect(ruleIds(messages), filePath).toContain('no-restricted-syntax')
    }
  })

  it('allows $fetch in app/api client modules', async () => {
    const messages = await lintCode(
      "export function getWallet() {\n  return $fetch('/api/wallet')\n}\n",
      'app/api/wallet.api.ts',
    )
    expect(ruleIds(messages)).not.toContain('no-restricted-syntax')
  })

  it('forbids serverSupabase* outside server/services', async () => {
    const messages = await lintCode(
      "export default defineEventHandler(async (event) => {\n  const client = serverSupabaseClient(event)\n  return client\n})\n",
      'server/api/wallet/index.get.ts',
    )
    expect(ruleIds(messages)).toContain('no-restricted-syntax')
  })

  it('allows serverSupabase* in server/services', async () => {
    const messages = await lintCode(
      "export async function getWallet(event) {\n  return serverSupabaseClient(event)\n}\n",
      'server/services/wallet.service.ts',
    )
    expect(ruleIds(messages)).not.toContain('no-restricted-syntax')
  })
})
