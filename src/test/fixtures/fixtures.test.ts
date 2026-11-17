import { describe, expect, it } from 'vitest'
import { matchFileSchema } from '@/schemas/import.schema'

const fixtures = import.meta.glob('./*.json', { eager: true, import: 'default' })
const fixtureEntries = Object.entries(fixtures)

describe('match fixtures', () => {
  it('has at least one fixture file', () => {
    expect(fixtureEntries.length).toBeGreaterThan(0)
  })

  it.each(fixtureEntries)('%s validates against matchFileSchema', (_path, fixture) => {
    const result = matchFileSchema.safeParse(fixture)
    expect(result.success).toBe(true)
  })
})
