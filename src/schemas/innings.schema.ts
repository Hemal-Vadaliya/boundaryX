import { z } from 'zod'
import { deliverySchema } from '@/schemas/delivery.schema'

export const batterInningsStateSchema = z.enum([
  'did-not-bat',
  'batting',
  'out',
  'retired-hurt',
  'retired-out',
  'not-out',
])

export const batterInningsSchema = z.object({
  playerId: z.string().min(1),
  state: batterInningsStateSchema,
  runs: z.number().int().nonnegative(),
  ballsFaced: z.number().int().nonnegative(),
  fours: z.number().int().nonnegative(),
  sixes: z.number().int().nonnegative(),
  battingPosition: z.number().int().positive().optional(),
})

export const bowlerFiguresSchema = z.object({
  playerId: z.string().min(1),
  legalBallsBowled: z.number().int().nonnegative(),
  runsConceded: z.number().int().nonnegative(),
  wickets: z.number().int().nonnegative(),
  maidens: z.number().int().nonnegative(),
  wides: z.number().int().nonnegative(),
  noBalls: z.number().int().nonnegative(),
})

export const inningsLifecycleStateSchema = z.enum([
  'not-started',
  'in-progress',
  'completed',
])

export const retirementEventSchema = z.object({
  playerId: z.string().min(1),
  type: z.enum(['retired-hurt', 'return']),
  timestamp: z.string().min(1),
})

export const interruptionEventSchema = z.object({
  reason: z.string().min(1),
  revisedOversAllocated: z.number().int().positive().optional(),
  timestamp: z.string().min(1),
})

export const deliveryCorrectionSchema = z.object({
  id: z.string().min(1),
  originalDelivery: deliverySchema,
  correctedDeliveryId: z.string().min(1),
  reason: z.string().optional(),
  timestamp: z.string().min(1),
})

export const inningsSchema = z.object({
  id: z.string().min(1),
  matchId: z.string().min(1),
  battingTeamId: z.string().min(1),
  bowlingTeamId: z.string().min(1),
  inningsNumber: z.number().int().positive(),
  state: inningsLifecycleStateSchema,
  deliveries: z.array(deliverySchema),
  batterInnings: z.record(z.string(), batterInningsSchema),
  bowlerFigures: z.record(z.string(), bowlerFiguresSchema),
  currentBatters: z
    .object({ striker: z.string().min(1), nonStriker: z.string().min(1).optional() })
    .optional(),
  currentBowlerId: z.string().optional(),
  lastOverBowlerId: z.string().optional(),
  freeHitActive: z.boolean(),
  legalBallsBowled: z.number().int().nonnegative(),
  wicketsLost: z.number().int().nonnegative(),
  declared: z.boolean(),
  target: z.number().int().nonnegative().optional(),
  oversAllocated: z.number().int().positive().optional(),
  interruptions: z.array(interruptionEventSchema).optional(),
  retirements: z.array(retirementEventSchema),
  corrections: z.array(deliveryCorrectionSchema),
})
