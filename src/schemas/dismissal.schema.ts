import { z } from 'zod'

export const dismissalTypeSchema = z.enum([
  'bowled',
  'caught',
  'caught-and-bowled',
  'lbw',
  'run-out',
  'stumped',
  'hit-wicket',
  'hit-ball-twice',
  'obstructing-the-field',
  'timed-out',
  'retired-out',
])

export const batterEndSchema = z.enum(['striker', 'non-striker'])

export const dismissalRecordSchema = z.object({
  type: dismissalTypeSchema,
  dismissedPlayerId: z.string().min(1),
  dismissedEnd: batterEndSchema,
  fielderId: z.string().optional(),
  assistingFielderId: z.string().optional(),
  creditsBowler: z.boolean(),
})
