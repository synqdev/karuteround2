---
phase: 01-foundation-recording
plan: "06"
subsystem: recording
tags: [web-audio-api, media-recorder, react-hooks, typescript, waveform, browser-mic]

# Dependency graph
requires:
  - phase: 01-01
    provides: Next.js 16 scaffold with TypeScript strict mode
provides:
  - useMediaRecorder hook with cross-browser format negotiation and full pause/resume state machine
  - useWaveformBars hook returning number[30] bar heights from AnalyserNode RMS + cosine envelope
  - useRecordingTimer hook with MM:SS formatting that freezes on pause

affects:
  - 01-07-recording-panel (imports all three hooks)
  - 02-ai-pipeline (receives audio Blob from useMediaRecorder result)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "MediaRecorder format negotiated at runtime via isTypeSupported() — never hardcoded"
    - "AudioContext created inside useEffect triggered by stream, not at module load — avoids browser autoplay block"
    - "useRef typed as T | undefined with explicit undefined initializer for TypeScript strict mode compatibility"

key-files:
  created:
    - src/hooks/use-media-recorder.ts
    - src/hooks/use-waveform-bars.ts
    - src/hooks/use-recording-timer.ts
  modified: []

key-decisions:
  - "Format priority: webm;codecs=opus → webm → mp4 (iOS Safari) → ogg → wav — negotiated via isTypeSupported()"
  - "AudioContext inside useEffect (not module load) — browser requires user gesture; stream arrival IS the gesture"
  - "Cosine envelope on waveform bars: center tallest, edges shortest — 0.15 + 0.85 * cos^2((i/(n-1) - 0.5) * pi)"
  - "useRecordingTimer FREEZES (not resets) when isRunning goes false — paused state preserves elapsed display"
  - "useRef<T | undefined>(undefined) — required pattern under TypeScript strict mode for nullable refs"

patterns-established:
  - "Recording state machine: idle → recording → paused ↔ recording → recorded"
  - "Waveform bars: 30 div elements driven by number[] heights, no canvas"
  - "Bar height formula: 8 + amplitude * cosineEnvelope * 92 + jitter — min 8px, max 100px"

# Metrics
duration: 8min
completed: 2026-03-14
---

# Phase 1 Plan 06: Recording Hooks Summary

**Three browser recording hooks — MediaRecorder with iOS/Chrome format negotiation, 30-bar RMS waveform via AnalyserNode cosine envelope, and a freeze-on-pause elapsed timer**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-14T00:00:00Z
- **Completed:** 2026-03-14T00:08:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- useMediaRecorder implements full state machine (idle/recording/paused/recorded) with runtime format negotiation covering Chrome (webm), iOS Safari (mp4), Firefox (ogg), and universal fallback (wav)
- useWaveformBars returns number[30] heights computed from AnalyserNode RMS amplitude per bucket with cosine envelope shaping — AudioContext safely deferred to useEffect post-user-gesture
- useRecordingTimer counts elapsed seconds via setInterval, freezes (not resets) when isRunning is false to preserve display during pause, formats as MM:SS

## Task Commits

Each task was committed atomically:

1. **Task 1: useMediaRecorder hook with format negotiation and pause/resume** - `1044a88` (feat)
2. **Task 2: useWaveformBars and useRecordingTimer hooks** - `e03f1ca` (feat)

## Files Created/Modified

- `src/hooks/use-media-recorder.ts` - MediaRecorder lifecycle with getSupportedMimeType(), pauseRecording/resumeRecording, stream lifecycle cleanup, durationMs excluding paused time
- `src/hooks/use-waveform-bars.ts` - AnalyserNode RMS per 30 buckets, cosineEnvelope shaping, requestAnimationFrame loop, flat 8px when active=false
- `src/hooks/use-recording-timer.ts` - setInterval counting, wasRunningRef for fresh-start detection, formatTime MM:SS, freeze behavior on pause

## Decisions Made

- Format negotiation via isTypeSupported() with priority: webm;codecs=opus → webm → mp4 → ogg → wav. iOS Safari < 18.4 does not support audio/webm so mp4 must be in the list.
- AudioContext created inside useEffect rather than at module load. Chrome and Safari suspend AudioContext instances not created within a user gesture handler. The stream prop only becomes non-null after the user clicks — that is the gesture boundary.
- Cosine envelope formula chosen to make the waveform visually bell-shaped: center bars at full amplitude, edges at 15% minimum. Formula: `0.15 + 0.85 * cos^2((index/(total-1) - 0.5) * pi)`.
- useRecordingTimer freezes rather than resets on pause because the timer display should show accumulated recording time while paused, not zero.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed useRef strict-mode TypeScript errors**
- **Found during:** Task 1 and Task 2 (type-check verification step)
- **Issue:** `useRef<number>()` and `useRef<AudioContext>()` with no argument are not valid under TypeScript strict mode — requires either an initial value or explicit `undefined` type union
- **Fix:** Changed to `useRef<number | undefined>(undefined)`, `useRef<AudioContext | undefined>(undefined)`, and `useRef<ReturnType<typeof setInterval> | undefined>(undefined)`
- **Files modified:** src/hooks/use-waveform-bars.ts, src/hooks/use-recording-timer.ts
- **Verification:** `npm run type-check` exits 0 after fix
- **Committed in:** e03f1ca (Task 2 commit, applied before commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - TypeScript strict mode useRef typing)
**Impact on plan:** Required for TypeScript strict compliance. No functional change, no scope creep.

## Issues Encountered

None beyond the useRef strict-mode fix documented above.

## User Setup Required

None - no external service configuration required. Hooks use browser-native APIs (MediaRecorder, Web Audio API) with no additional dependencies.

## Next Phase Readiness

- All three hooks ready for import by 01-07 recording panel UI
- useMediaRecorder.stream fed to useWaveformBars(stream, state === 'recording')
- useRecordingTimer(state === 'recording') for elapsed display
- Blob from useMediaRecorder.result fed to Phase 2 AI pipeline transcription route

---
*Phase: 01-foundation-recording*
*Completed: 2026-03-14*
