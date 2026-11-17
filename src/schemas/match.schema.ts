import { z } from 'zod'
import { matchFormatConfigSchema, rulesProfileSchema } from '@/schemas/rules.schema'
import { teamInMatchSchema } from '@/schemas/team.schema'
import { inningsSchema } from '@/schemas/innings.schema'
import { matchResultSchema } from '@/schemas/result.schema'
import { matchStatusSchema } from '@/schemas/common.schema'

export const tossInfoSchema = z.object({
  wonByTeamId: z.string().min(1),
  decision: z.enum(['bat', 'bowl']),
})

export const matchDocumentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  venue: z.string().optional(),
  matchDate: z.string().min(1),
  formatConfig: matchFormatConfigSchema,
  rulesProfile: rulesProfileSchema,
  teams: z.tuple([teamInMatchSchema, teamInMatchSchema]),
  toss: tossInfoSchema.optional(),
  innings: z.array(inningsSchema),
  result: matchResultSchema.optional(),
  status: matchStatusSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  sourceMatchId: z.string().optional(),
})
