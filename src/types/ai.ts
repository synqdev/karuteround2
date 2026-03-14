import { z } from 'zod'

/**
 * Fixed predefined set of entry categories for AI extraction.
 * Used by GPT structured output to constrain category values.
 */
export const ENTRY_CATEGORIES = [
  'Preference',
  'Treatment',
  'Lifestyle',
  'Health',
  'Allergy',
  'Style',
] as const

export type EntryCategory = (typeof ENTRY_CATEGORIES)[number]

/**
 * Zod schema for a single AI-extracted karute entry.
 * All fields are required — no .optional() fields per structured output restriction.
 */
export const EntrySchema = z.object({
  category: z.enum(ENTRY_CATEGORIES),
  title: z.string(),
  source_quote: z.string(),
  confidence_score: z.number().min(0).max(1),
})

export type Entry = z.infer<typeof EntrySchema>

/**
 * Zod schema for the full extraction result returned by GPT.
 * Wraps an array of entries — structured output guarantees this shape.
 */
export const ExtractionResultSchema = z.object({
  entries: z.array(EntrySchema),
})

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>

/**
 * Zod schema for the session summary returned by GPT.
 */
export const SummaryResultSchema = z.object({
  summary: z.string(),
})

export type SummaryResult = z.infer<typeof SummaryResultSchema>
