import type { MatchFormat, MatchStatus } from '@/types/common'
import type { MatchFilters } from '@/components/common/MatchFilterBar'

export function applyMatchFilters<
  T extends {
    summary: {
      name: string
      teamAName: string
      teamBName: string
      status: MatchStatus
      format: MatchFormat
    }
  },
>(matches: T[], filters: MatchFilters): T[] {
  const query = filters.query.trim().toLowerCase()
  return matches.filter(({ summary }) => {
    if (filters.status !== 'all' && summary.status !== filters.status) return false
    if (filters.format !== 'all' && summary.format !== filters.format) return false
    if (!query) return true
    return (
      summary.name.toLowerCase().includes(query) ||
      summary.teamAName.toLowerCase().includes(query) ||
      summary.teamBName.toLowerCase().includes(query)
    )
  })
}
