import { z } from 'zod'

export const matchFormatSchema = z.enum(['T10', 'T20', 'ODI', 'Test', 'Custom'])
export const matchStatusSchema = z.enum(['upcoming', 'ongoing', 'completed', 'abandoned'])
