'use client'

import { useState } from 'react'
import { createAppointment } from '@/actions/appointments'
import type { CustomerOption } from '@/components/karute/CustomerCombobox'

interface AppointmentPopoutProps {
  staffId: string
  staffName: string
  startMinute: number
  selectedDate: Date
  customers: CustomerOption[]
  onCreated: () => void
  onClose: () => void
}

function formatTime(minute: number) {
  const h = Math.floor(minute / 60)
  const m = minute % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

export function AppointmentPopout({
  staffId,
  staffName,
  startMinute,
  selectedDate,
  customers,
  onCreated,
  onClose,
}: AppointmentPopoutProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [duration, setDuration] = useState(60)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const endMinute = startMinute + duration
  const timeLabel = `${formatTime(startMinute)} - ${formatTime(endMinute)}`

  const filteredCustomers = searchQuery
    ? customers.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : customers

  async function handleCreate() {
    if (!selectedCustomerId) return
    setSaving(true)
    setError(null)

    const startDate = new Date(selectedDate)
    startDate.setHours(Math.floor(startMinute / 60), startMinute % 60, 0, 0)

    const result = await createAppointment({
      staffProfileId: staffId,
      clientId: selectedCustomerId,
      startTime: startDate.toISOString(),
      durationMinutes: duration,
    })

    if ('error' in result) {
      setError(result.error ?? 'Failed to create appointment')
      setSaving(false)
      return
    }

    onCreated()
  }

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)

  return (
    <div className="absolute z-50 w-80 rounded-xl border border-border/50 bg-card shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-200">
      <div className="border-b border-border/30 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">New Appointment</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Staff + Time */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{staffName}</span>
          <span className="font-medium">{timeLabel}</span>
        </div>

        {/* Duration selector */}
        <div className="flex gap-1.5">
          {[30, 60, 90, 120].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                duration === d
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {d}m
            </button>
          ))}
        </div>

        {/* Customer selector — search + list */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Customer</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="mt-1.5 max-h-32 overflow-y-auto rounded-lg border border-border/50">
            {filteredCustomers.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">No customers found</div>
            ) : (
              filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setSelectedCustomerId(c.id); setSearchQuery('') }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-muted/50 ${
                    selectedCustomerId === c.id ? 'bg-muted font-medium' : ''
                  }`}
                >
                  {c.name}
                </button>
              ))
            )}
          </div>
          {selectedCustomer && (
            <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-sm">
              <span className="text-muted-foreground">Selected:</span>
              <span className="font-medium">{selectedCustomer.name}</span>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {/* Create button */}
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving || !selectedCustomerId}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Creating...' : 'Create Appointment'}
        </button>
      </div>
    </div>
  )
}
