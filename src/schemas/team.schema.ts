import { z } from 'zod'
import { playerSchema } from '@/schemas/player.schema'

export const teamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  squad: z.array(playerSchema),
  captainId: z.string().optional(),
  wicketkeeperId: z.string().optional(),
})

export const teamInMatchSchema = z.object({
  team: teamSchema,
  playingXiIds: z.array(z.string()),
  captainId: z.string().optional(),
  wicketkeeperId: z.string().optional(),
})
