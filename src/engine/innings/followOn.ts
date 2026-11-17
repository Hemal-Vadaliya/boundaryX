import type { RulesProfile } from '@/engine/rules/types'

export interface FollowOnCheckInput {
  firstBattingTeamFirstInningsRuns: number
  secondBattingTeamFirstInningsRuns: number
}

export function isFollowOnEligible(
  input: FollowOnCheckInput,
  rulesProfile: RulesProfile
): boolean {
  if (!rulesProfile.followOnEnabled || rulesProfile.followOnMarginRuns === undefined) {
    return false
  }
  const deficit =
    input.firstBattingTeamFirstInningsRuns - input.secondBattingTeamFirstInningsRuns
  return deficit >= rulesProfile.followOnMarginRuns
}
