'use client'

import { useEffect, useRef } from 'react'
import { saveDraft } from '@/lib/karute/draft'
import { SaveKaruteFlow } from '@/components/karute/SaveKaruteFlow'
import type { CustomerOption } from '@/components/karute/CustomerCombobox'
import type { Entry } from '@/types/ai'

interface ReviewConfirmStepProps {
  /**
   * Full session transcript from Phase 2 AI pipeline.
   */
  transcript: string
  /**
   * AI-generated summary text confirmed by the user.
   */
  summary: string
  /**
   * Confirmed and edited entries from the ReviewScreen.
   * These use the ai.ts Entry shape and are mapped to KaruteDraftEntry format.
   */
  entries: Entry[]
  /**
   * Pre-fetched customer list passed from the server page.
   * Avoids a client-side fetch inside SaveKaruteFlow on mount.
   */
  customers: CustomerOption[]
  /**
   * Optional recording duration in seconds from Phase 1.
   */
  duration?: number
}

/**
 * Final step of the AI review screen.
 *
 * Responsibilities:
 *   1. On mount, call saveDraft() to write the confirmed review data to
 *      sessionStorage so SaveKaruteFlow can read it.
 *   2. Render SaveKaruteFlow inline with the customer combobox and save button.
 *      No separate page — per user decision the combobox appears inline after confirm.
 *
 * Entry field mapping (ai.ts → KaruteDraftEntry):
 *   title           → content
 *   source_quote    → sourceQuote
 *   confidence_score → confidenceScore
 *   category        → category (passed through; getCategoryConfig falls back to 'other' for unknown values)
 */
export function ReviewConfirmStep({
  transcript,
  summary,
  entries,
  customers,
  duration,
}: ReviewConfirmStepProps) {
  // Track whether draft has been saved to avoid re-writing on re-renders
  const draftSavedRef = useRef(false)

  useEffect(() => {
    if (draftSavedRef.current) return
    draftSavedRef.current = true

    saveDraft({
      transcript,
      summary,
      entries: entries.map((e) => ({
        category: e.category,
        content: e.title,
        sourceQuote: e.source_quote,
        confidenceScore: e.confidence_score,
      })),
      duration,
    })
  }, [transcript, summary, entries, duration])

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-white/10 bg-[#2a2a2a] p-4">
        <h2 className="mb-1 text-sm font-semibold text-white/70">AI Summary</h2>
        <p className="text-sm text-white/60 leading-relaxed">{summary}</p>
        <p className="mt-3 text-xs text-white/40">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'} confirmed
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-white/70">Select customer &amp; save</h3>
        <SaveKaruteFlow customers={customers} />
      </div>
    </div>
  )
}
