import { describe, expect, it } from 'vitest'
import { resolveRulesProfile } from '@/engine/rules/resolver/resolveRulesProfile'
import { standardFormatProfile } from '@/engine/rules/formats/standardProfiles'
import type { CompetitionOverride } from '@/engine/rules/competitions/types'

describe('resolveRulesProfile', () => {
  it('returns the standard format profile unchanged when there are no overrides', () => {
    const resolved = resolveRulesProfile({ format: 'T20' })
    expect(resolved).toEqual(standardFormatProfile('T20'))
    expect(resolved.isOfficial).toBe(false)
  })

  it('applies a competition override on top of the base format profile', () => {
    const override: CompetitionOverride = {
      id: 'league-x-2026',
      label: 'League X 2026',
      appliesToFormat: 'T20',
      isOfficial: true,
      overrides: { maxOversPerBowler: 3 },
    }
    const resolved = resolveRulesProfile({ format: 'T20', competitionOverride: override })
    expect(resolved.maxOversPerBowler).toBe(3)
    expect(resolved.id).toBe('league-x-2026')
    expect(resolved.isOfficial).toBe(true)
    // Unoverridden fields still inherit from the base profile.
    expect(resolved.ballsPerOver).toBe(6)
    expect(resolved.freeHitEnabled).toBe(true)
  })

  it('marks the result as non-official whenever local custom overrides are applied, even over an official competition profile', () => {
    const override: CompetitionOverride = {
      id: 'league-x-2026',
      label: 'League X 2026',
      appliesToFormat: 'T20',
      isOfficial: true,
      overrides: {},
    }
    const resolved = resolveRulesProfile({
      format: 'T20',
      competitionOverride: override,
      customOverrides: { maxOversPerBowler: 5 },
    })
    expect(resolved.isOfficial).toBe(false)
    expect(resolved.maxOversPerBowler).toBe(5)
    expect(resolved.label).toContain('custom')
  })

  it('never marks a bare custom format profile as official', () => {
    const resolved = resolveRulesProfile({ format: 'Custom' })
    expect(resolved.isOfficial).toBe(false)
  })

  it('is deterministic: the same input always produces the same output', () => {
    const a = resolveRulesProfile({ format: 'ODI' })
    const b = resolveRulesProfile({ format: 'ODI' })
    expect(a).toEqual(b)
  })
})
