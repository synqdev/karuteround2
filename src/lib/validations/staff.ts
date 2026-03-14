import { z } from 'zod'

export const staffProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
})

export type StaffProfileInput = z.infer<typeof staffProfileSchema>
