/**
 * Universal constants from the MCC Laws of Cricket that hold regardless of
 * format or competition playing conditions. Format/competition profiles
 * build on top of these — they do not override them.
 */
export const MCC_LAWS = {
  standardBallsPerOver: 6,
  standardPlayersPerSide: 11,
  /** Under the Laws, a bowler may not bowl two consecutive overs. */
  noConsecutiveOvers: true,
  /** Byes and leg-byes are legal deliveries under the Laws. */
  byesCountAsLegalDelivery: true,
} as const
