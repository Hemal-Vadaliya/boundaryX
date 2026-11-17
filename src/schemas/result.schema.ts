import { z } from 'zod'

export const matchOutcomeSchema = z.enum(['win', 'tie', 'no-result', 'draw'])

export const matchResultSchema = z.object({
  outcome: matchOutcomeSchema,
  winningTeamId: z.string().optional(),
  winMargin: z
    .object({ by: z.enum(['runs', 'wickets']), amount: z.number().int().nonnegative() })
    .optional(),
  summary: z.string().min(1),
})
