import { z } from 'zod'
import { matchFormatSchema } from '@/schemas/common.schema'

export const matchFormatConfigSchema = z.object({
  format: matchFormatSchema,
  oversPerInnings: z.number().int().positive().optional(),
  inningsPerTeam: z.number().int().positive(),
  ballsPerOver: z.number().int().positive(),
  isCustom: z.boolean(),
})

export const powerplayPhaseSchema = z.object({
  name: z.string().min(1),
  startOver: z.number().int().nonnegative(),
  endOver: z.number().int().nonnegative(),
  maxFieldersOutsideCircle: z.number().int().nonnegative(),
})

export const rulesProfileSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  isOfficial: z.boolean(),
  ballsPerOver: z.number().int().positive(),
  oversPerInnings: z.number().int().positive().optional(),
  inningsPerTeam: z.number().int().positive(),
  maxOversPerBowler: z.number().int().positive().optional(),
  noConsecutiveOvers: z.boolean(),
  freeHitEnabled: z.boolean(),
  byesCountAsLegalDelivery: z.boolean(),
  powerplays: z.array(powerplayPhaseSchema),
  followOnEnabled: z.boolean(),
  followOnMarginRuns: z.number().int().positive().optional(),
  superOverEnabled: z.boolean(),
  dlsG50: z.number().positive().optional(),
  effectiveFrom: z.string().optional(),
  governingBody: z.string().optional(),
})
