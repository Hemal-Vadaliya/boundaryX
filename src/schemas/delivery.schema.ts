import { z } from 'zod'
import { dismissalRecordSchema } from '@/schemas/dismissal.schema'

export const extrasBreakdownSchema = z.object({
  wides: z.number().int().nonnegative(),
  noBallRuns: z.number().int().nonnegative(),
  byes: z.number().int().nonnegative(),
  legByes: z.number().int().nonnegative(),
  penaltyRuns: z.number().int().nonnegative(),
})

export const legalDeliveryOutcomeSchema = z.enum(['legal', 'wide', 'no-ball'])

export const deliverySchema = z.object({
  id: z.string().min(1),
  inningsId: z.string().min(1),
  sequenceNumber: z.number().int().nonnegative(),
  overNumber: z.number().int().nonnegative(),
  legalBallNumber: z.number().int().positive().optional(),
  strikerIdBefore: z.string().min(1),
  nonStrikerIdBefore: z.string().min(1).optional(),
  bowlerId: z.string().min(1),
  batterRuns: z.number().int().nonnegative(),
  extras: extrasBreakdownSchema,
  outcome: legalDeliveryOutcomeSchema,
  dismissal: dismissalRecordSchema.optional(),
  incomingBatterId: z.string().optional(),
  isFreeHit: z.boolean(),
  overthrowRuns: z.number().int().nonnegative().optional(),
  timestamp: z.string().min(1),
  correctsDeliveryId: z.string().optional(),
})
