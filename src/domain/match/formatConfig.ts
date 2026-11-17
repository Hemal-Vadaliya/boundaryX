import type { MatchFormat } from '@/types/common'

export interface MatchFormatConfig {
  format: MatchFormat
  /** Overs per innings. Undefined means unlimited (e.g. Test cricket). */
  oversPerInnings?: number
  inningsPerTeam: number
  ballsPerOver: number
  isCustom: boolean
}

const BASE: Omit<
  MatchFormatConfig,
  'format' | 'oversPerInnings' | 'inningsPerTeam' | 'isCustom'
> = {
  ballsPerOver: 6,
}

export function defaultFormatConfig(format: MatchFormat): MatchFormatConfig {
  switch (format) {
    case 'T10':
      return { ...BASE, format, oversPerInnings: 10, inningsPerTeam: 1, isCustom: false }
    case 'T20':
      return { ...BASE, format, oversPerInnings: 20, inningsPerTeam: 1, isCustom: false }
    case 'ODI':
      return { ...BASE, format, oversPerInnings: 50, inningsPerTeam: 1, isCustom: false }
    case 'Test':
      return {
        ...BASE,
        format,
        oversPerInnings: undefined,
        inningsPerTeam: 2,
        isCustom: false,
      }
    case 'Custom':
      return { ...BASE, format, oversPerInnings: 20, inningsPerTeam: 1, isCustom: true }
  }
}
