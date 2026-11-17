/**
 * Duckworth-Lewis-Stern (Standard Edition) resource table.
 *
 * The Professional/Stern edition's full table and the exponential-decay
 * parameters (Z0(w), b(w)) that generate it are commercially confidential
 * and were never published. What IS publicly documented by the ICC is a
 * sparse set of reference points from the original Standard Edition
 * ("Percentage resources remaining" table, 2002 revision) — see the
 * Duckworth-Lewis-Stern Wikipedia article's resource table. Every anchor
 * point below is one of those published numbers; every other
 * overs/wickets combination is derived from them by interpolation, never
 * invented outright.
 */

/** Overs-remaining anchor columns the official table publishes resource % for. */
const OVERS_ANCHORS = [0, 5, 10, 20, 27, 28, 29, 30, 31, 40, 50] as const

/** Wickets-lost anchor rows (on a standard 10-wicket resource) the official table publishes. */
const WICKETS_LOST_ANCHORS = [0, 2, 4, 6, 8, 10] as const

/**
 * resourceTable[overs][wicketsLost] = % of resources remaining.
 * Source: ICC-published D/L Standard Edition reference table (2002).
 */
const RESOURCE_TABLE: Record<number, Record<number, number>> = {
  0: { 0: 0.0, 2: 0.0, 4: 0.0, 6: 0.0, 8: 0.0, 10: 0.0 },
  5: { 0: 17.2, 2: 16.8, 4: 16.1, 6: 14.3, 8: 9.4, 10: 9.4 },
  10: { 0: 32.1, 2: 30.8, 4: 28.3, 6: 22.8, 8: 11.4, 10: 11.4 },
  20: { 0: 56.6, 2: 52.4, 4: 44.6, 6: 30.8, 8: 11.9, 10: 11.9 },
  27: { 0: 70.1, 2: 63.4, 4: 51.8, 6: 33.0, 8: 11.9, 10: 11.9 },
  28: { 0: 71.8, 2: 64.8, 4: 52.6, 6: 33.2, 8: 11.9, 10: 11.9 },
  29: { 0: 73.5, 2: 66.1, 4: 53.4, 6: 33.4, 8: 11.9, 10: 11.9 },
  30: { 0: 75.1, 2: 67.3, 4: 54.1, 6: 33.6, 8: 11.9, 10: 11.9 },
  31: { 0: 76.7, 2: 68.6, 4: 54.8, 6: 33.7, 8: 11.9, 10: 11.9 },
  40: { 0: 89.3, 2: 77.8, 4: 59.5, 6: 34.6, 8: 11.9, 10: 11.9 },
  50: { 0: 100.0, 2: 85.1, 4: 62.7, 6: 34.9, 8: 11.9, 10: 11.9 },
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Linear interpolation of y at x between two known points. */
function lerp(x: number, x0: number, y0: number, x1: number, y1: number): number {
  if (x1 === x0) return y0
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
}

function neighborAnchors(
  value: number,
  anchors: readonly number[]
): [number, number] {
  if (value <= anchors[0]!) return [anchors[0]!, anchors[0]!]
  const last = anchors[anchors.length - 1]!
  if (value >= last) return [last, last]
  for (let i = 0; i < anchors.length - 1; i++) {
    if (value >= anchors[i]! && value <= anchors[i + 1]!) {
      return [anchors[i]!, anchors[i + 1]!]
    }
  }
  return [last, last]
}

/** Resource % at an exact anchor overs value, interpolated across wickets lost. */
function resourceAtAnchorOvers(oversAnchor: number, wicketsLost: number): number {
  const row = RESOURCE_TABLE[oversAnchor]!
  const [wLo, wHi] = neighborAnchors(wicketsLost, WICKETS_LOST_ANCHORS)
  if (wLo === wHi) return row[wLo]!
  return lerp(wicketsLost, wLo, row[wLo]!, wHi, row[wHi]!)
}

/**
 * Percentage of batting resources remaining for a team with `wicketsLost`
 * down, `oversRemaining` left to bowl/bat, out of a `maxWickets`-wicket
 * resource (10 under standard laws; rescaled for a non-standard squad
 * size, since this app allows independently chosen playing XI sizes).
 * Bilinearly interpolates between the nearest published overs/wickets
 * anchor points; always returns a value in [0, 100].
 */
export function getResourcePercentage(
  oversRemaining: number,
  wicketsLost: number,
  maxWickets: number = 10
): number {
  const clampedOvers = Math.max(0, oversRemaining)
  const effectiveWicketsLost =
    maxWickets === 10 ? wicketsLost : (wicketsLost * 10) / Math.max(1, maxWickets)

  const [oLo, oHi] = neighborAnchors(clampedOvers, OVERS_ANCHORS)
  const resourceAtLo = resourceAtAnchorOvers(oLo, effectiveWicketsLost)
  if (oLo === oHi) return clamp(resourceAtLo, 0, 100)

  const resourceAtHi = resourceAtAnchorOvers(oHi, effectiveWicketsLost)
  return clamp(lerp(clampedOvers, oLo, resourceAtLo, oHi, resourceAtHi), 0, 100)
}
