'use client'

import { useEffect, useState } from 'react'
import { Gift } from 'lucide-react'

interface AIAdviceProps {
  summary: string | null
  entries: { category: string; title: string }[]
  locale: string
}

export function AIAdvice({ summary, entries, locale }: AIAdviceProps) {
  const [advice, setAdvice] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAdvice() {
      try {
        const res = await fetch('/api/ai/advice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary, entries, locale }),
        })
        const data = await res.json()
        setAdvice(data.advice || null)
      } catch {
        setAdvice(null)
      } finally {
        setLoading(false)
      }
    }
    fetchAdvice()
  }, [summary, entries, locale])

  if (loading) {
    return (
      <div className="rounded-xl border border-border/30 bg-gradient-to-r from-amber-500/5 to-transparent p-5">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold">Advice for Next Visit</h3>
        </div>
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (!advice) return null

  return (
    <div className="rounded-xl border border-border/30 bg-gradient-to-r from-amber-500/5 to-transparent p-5">
      <div className="flex items-center gap-2 mb-3">
        <Gift className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold">Advice for Next Visit</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{advice}</p>
    </div>
  )
}
