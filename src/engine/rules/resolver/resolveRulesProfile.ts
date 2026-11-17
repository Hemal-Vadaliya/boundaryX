import type { MatchFormat } from '@/types/common'
import type { RulesProfile } from '@/engine/rules/types'
import type { CompetitionOverride } from '@/engine/rules/competitions/types'
import { standardFormatProfile } from '@/engine/rules/formats/standardProfiles'

export interface ResolveRulesProfileInput {
  format: MatchFormat
  competitionOverride?: CompetitionOverride
  /** User-supplied overrides for a genuinely custom local profile. Always marks the result as non-official. */
  customOverrides?: Partial<Omit<RulesProfile, 'id' | 'label' | 'isOfficial'>>
}

/**
 * Deterministically resolves the final rules profile for a match: base
 * format profile, then competition overrides, then any local custom
 * overrides. A profile is only ever marked isOfficial when it was produced
 * from a reviewed competition override with no further local edits — the
 * plan's governance rule (section 24) requires every "official" claim to
 * be traceable to a reviewed source document.
 */
export function resolveRulesProfile(input: ResolveRulesProfileInput): RulesProfile {
  const base = standardFormatProfile(input.format)

  let resolved: RulesProfile = base

  if (input.competitionOverride) {
    const { overrides, id, label, isOfficial, governingBody, effectiveFrom } =
      input.competitionOverride
    resolved = {
      ...resolved,
      ...overrides,
      id,
      label,
      isOfficial,
      governingBody: governingBody ?? resolved.governingBody,
      effectiveFrom: effectiveFrom ?? resolved.effectiveFrom,
    }
  }

  if (input.customOverrides) {
    resolved = {
      ...resolved,
      ...input.customOverrides,
      id: resolved.id === base.id ? 'custom' : `${resolved.id}-custom`,
      label: `${resolved.label} (custom)`,
      isOfficial: false,
    }
  }

  return resolved
}
