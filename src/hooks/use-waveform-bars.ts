'use client'
import { useEffect, useRef, useState } from 'react'

const BAR_COUNT = 30

/**
 * Cosine envelope: center bars are tallest, edges are shortest.
 * Returns a multiplier 0.15–1.0 for each bar position.
 */
function cosineEnvelope(index: number, total: number): number {
  return 0.15 + 0.85 * Math.cos(((index / (total - 1)) - 0.5) * Math.PI) ** 2
}

/**
 * Compute RMS amplitude from a time-domain data buffer slice.
 * Returns a value 0.0–1.0.
 */
function rms(data: Uint8Array, start: number, end: number): number {
  let sum = 0
  const count = end - start
  for (let i = start; i < end; i++) {
    const normalized = (data[i] - 128) / 128 // -1.0 to 1.0
    sum += normalized * normalized
  }
  return Math.sqrt(sum / count)
}

/**
 * useWaveformBars — returns number[30] bar heights (8–100px range).
 *
 * @param stream  Live MediaStream from getUserMedia. null = bars go flat.
 * @param active  When false (paused state), bars return to flat 8px immediately.
 *
 * CRITICAL: AudioContext must be created INSIDE useEffect (triggered by stream change),
 * not at module load time. Browsers suspend AudioContext created without user gesture.
 * The stream is provided only after the user clicks — that IS the gesture.
 */
export function useWaveformBars(
  stream: MediaStream | null,
  active: boolean
): number[] {
  const [bars, setBars] = useState<number[]>(Array(BAR_COUNT).fill(8))
  const animFrameRef = useRef<number | undefined>(undefined)
  const audioCtxRef = useRef<AudioContext | undefined>(undefined)

  useEffect(() => {
    if (!stream || !active) {
      // Bars go flat when not recording (idle or paused)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      setBars(Array(BAR_COUNT).fill(8))
      return
    }

    // Create AudioContext inside the effect — stream only exists after user gesture
    const audioCtx = new AudioContext()
    audioCtxRef.current = audioCtx

    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }

    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.8

    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const bucketSize = Math.floor(bufferLength / BAR_COUNT)

    function draw() {
      animFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteTimeDomainData(dataArray)

      // Compute overall RMS for audio level (like reference app)
      let totalSum = 0
      for (let i = 0; i < bufferLength; i++) {
        const val = (dataArray[i] - 128) / 128
        totalSum += val * val
      }
      const audioLevel = Math.min(1, Math.sqrt(totalSum / bufferLength) * 4)

      const newBars = Array.from({ length: BAR_COUNT }, (_, i) => {
        const envelope = cosineEnvelope(i, BAR_COUNT)
        // Use audioLevel (amplified) + per-bar jitter for variation
        const jitter = Math.sin(i * 2.1 + Date.now() * 0.003) * 0.15 +
                       Math.cos(i * 3.7 + Date.now() * 0.002) * 0.1
        const barLevel = audioLevel * envelope + jitter * audioLevel
        const height = Math.max(6, barLevel * 96)
        return Math.max(6, Math.min(100, height))
      })

      setBars(newBars)
    }

    draw()

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      audioCtx.close()
    }
  }, [stream, active])

  return bars
}
