import type { RulesProfile } from '@/engine/rules/types'

/**
 * A competition's playing-condition overrides, applied on top of a standard
 * format profile. Only the fields a competition actually changes need to be
 * specified — everything else inherits from the base format profile.
 */
export interface CompetitionOverride {
  id: string
  label: string
  appliesToFormat: string
  isOfficial: boolean
  governingBody?: string
  effectiveFrom?: string
  overrides: Partial<Omit<RulesProfile, 'id' | 'label' | 'isOfficial'>>
}
