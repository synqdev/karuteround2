import { Entry } from '@/types/ai'

/**
 * Represents each step of the AI processing pipeline.
 */
export type PipelineStep = 'transcribing' | 'extracting' | 'summarizing' | 'complete' | 'error'

/**
 * The full result returned when the pipeline completes successfully.
 */
export type PipelineResult = {
  transcript: string
  entries: Entry[]
  summary: string
}

/**
 * Retries a fetch call once on failure.
 * - First failure: waits 1.5 seconds, then retries.
 * - Second failure: throws.
 */
async function fetchWithRetry(fn: () => Promise<Response>): Promise<Response> {
  try {
    const res = await fn()
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`HTTP ${res.status}: ${errText}`)
    }
    return res
  } catch (firstError) {
    // Wait 1.5 seconds before retrying
    await new Promise((resolve) => setTimeout(resolve, 1500))
    try {
      const res = await fn()
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`HTTP ${res.status}: ${errText}`)
      }
      return res
    } catch (secondError) {
      throw secondError
    }
  }
}

/**
 * Orchestrates the full AI processing pipeline:
 *   1. Transcribe audio blob via Whisper (/api/ai/transcribe)
 *   2. Run extraction and summary in parallel via Promise.all (/api/ai/extract + /api/ai/summarize)
 *
 * Calls onProgress at each stage so UI can show step-by-step progress.
 * Auto-retries each API call once on failure; throws on second failure.
 */
export async function runAIPipeline(
  audioBlob: Blob,
  locale: string,
  onProgress: (step: PipelineStep) => void,
): Promise<PipelineResult> {
  // Step 1: Transcription
  onProgress('transcribing')

  const formData = new FormData()
  formData.append('audio', audioBlob)
  formData.append('locale', locale)

  const transcribeRes = await fetchWithRetry(() =>
    fetch('/api/ai/transcribe', {
      method: 'POST',
      body: formData,
    }),
  ).catch((err) => {
    throw new Error(`Transcription failed: ${err instanceof Error ? err.message : String(err)}`)
  })

  const transcribeData = await transcribeRes.json()
  const transcript: string = transcribeData.transcript

  if (!transcript) {
    throw new Error('Transcription returned an empty transcript.')
  }

  // Step 2: Parallel extraction and summary
  onProgress('extracting')

  const [extractRes, summarizeRes] = await Promise.all([
    fetchWithRetry(() =>
      fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, locale }),
      }),
    ).catch((err) => {
      throw new Error(`Extraction failed: ${err instanceof Error ? err.message : String(err)}`)
    }),
    fetchWithRetry(() =>
      fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, locale }),
      }),
    ).catch((err) => {
      throw new Error(`Summary generation failed: ${err instanceof Error ? err.message : String(err)}`)
    }),
  ])

  const extractData = await extractRes.json()
  const summarizeData = await summarizeRes.json()

  const entries: Entry[] = extractData.entries
  const summary: string = summarizeData.summary

  // Step 3: Complete
  onProgress('complete')

  return { transcript, entries, summary }
}
