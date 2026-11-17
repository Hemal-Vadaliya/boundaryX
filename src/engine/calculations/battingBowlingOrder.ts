import type { Innings } from '@/domain/innings/types'

/** Players in the order they came to the crease (by recorded battingPosition), used to render batting scorecard rows in batting order. */
export function getBattingOrder(innings: Innings): string[] {
  return Object.values(innings.batterInnings)
    .filter((b) => b.battingPosition !== undefined)
    .sort((a, b) => a.battingPosition! - b.battingPosition!)
    .map((b) => b.playerId)
}

/** Bowlers in the order they first bowled a delivery. */
export function getBowlingOrder(innings: Innings): string[] {
  const order: string[] = []
  for (const delivery of innings.deliveries) {
    if (!order.includes(delivery.bowlerId)) order.push(delivery.bowlerId)
  }
  return order
}
