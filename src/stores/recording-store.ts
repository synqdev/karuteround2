import { create } from 'zustand'

interface RecordingUIState {
  /** Signal to open the recording panel on dashboard */
  shouldOpenPanel: boolean
  requestOpenPanel: () => void
  clearOpenRequest: () => void
}

export const useRecordingUIStore = create<RecordingUIState>((set) => ({
  shouldOpenPanel: false,
  requestOpenPanel: () => set({ shouldOpenPanel: true }),
  clearOpenRequest: () => set({ shouldOpenPanel: false }),
}))

// --- Global recording state for mini recorder ---

export type GlobalRecState = 'idle' | 'recording' | 'paused'

interface GlobalRecordingStore {
  state: GlobalRecState
  startedAt: number | null
  setRecording: (state: GlobalRecState) => void
  setStartedAt: (ts: number | null) => void
  reset: () => void
}

export const useGlobalRecording = create<GlobalRecordingStore>((set) => ({
  state: 'idle',
  startedAt: null,
  setRecording: (state) => set({ state }),
  setStartedAt: (ts) => set({ startedAt: ts }),
  reset: () => set({ state: 'idle', startedAt: null }),
}))
