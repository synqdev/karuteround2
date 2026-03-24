'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useGlobalRecording } from '@/stores/recording-store'
import { useRouter } from '@/i18n/navigation'

export function MiniRecorder() {
  const { state, startedAt, reset } = useGlobalRecording()
  const pathname = usePathname()
  const router = useRouter()
  const [elapsed, setElapsed] = useState(0)

  // Don't show on the sessions page (full recorder is there)
  const isOnSessionsPage = pathname.includes('/sessions')
  const isActive = state === 'recording' || state === 'paused'
  const show = isActive && !isOnSessionsPage

  // Timer
  useEffect(() => {
    if (state !== 'recording' || !startedAt) {
      return
    }
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [state, startedAt])

  if (!show) return null

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-2 duration-300">
      <button
        type="button"
        onClick={() => router.push('/sessions' as Parameters<typeof router.push>[0])}
        className="flex items-center gap-3 rounded-full bg-red-500 text-white pl-4 pr-5 py-2 shadow-lg shadow-red-500/30 hover:bg-red-400 transition-colors"
      >
        {/* Pulsing dot */}
        <div className="relative">
          <div className="h-3 w-3 rounded-full bg-white" />
          {state === 'recording' && (
            <div className="absolute inset-0 h-3 w-3 rounded-full bg-white animate-ping" />
          )}
        </div>

        {/* Timer */}
        <span className="text-sm font-mono font-semibold tabular-nums">{timeStr}</span>

        {/* State label */}
        <span className="text-xs font-medium opacity-80">
          {state === 'paused' ? 'Paused' : 'Recording'}
        </span>

        {/* Tap to return */}
        <span className="text-[10px] opacity-60 ml-1">Tap to return</span>
      </button>
    </div>
  )
}
