'use client'

export type EmployeeTimelineBarType = 'booking' | 'open' | 'blocked' | 'recording' | 'processing'

export interface EmployeeTimelineBarData {
  id: string
  rowId: string
  startMinute: number
  durationMinute: number
  title: string
  subtitle?: string
  type: EmployeeTimelineBarType
}

export interface EmployeeTimelineBarProps {
  item: EmployeeTimelineBarData
  className?: string
}

export function EmployeeTimelineBar({ item, className = '' }: EmployeeTimelineBarProps) {
  const typeStyles: Record<string, string> = {
    processing: 'animate-pulse bg-[#8b5cf6]/80 text-white',
    recording: 'animate-pulse bg-[#f59e0b]/80 text-white',
    booking: 'bg-[#8a9ba3] text-white',
    blocked: 'bg-[#d4a1a6] text-[#f8f1f1]',
    open: 'bg-[#a8b0b5] text-white/80',
  }
  const baseClass = typeStyles[item.type] || typeStyles.open

  return (
    <div className={`h-full w-full rounded-[24px] px-4 py-2 text-[9px] font-semibold leading-[1.15] ${baseClass} ${className}`}>
      <div>{item.title}</div>
      {item.subtitle ? <div className="whitespace-pre-line">{item.subtitle}</div> : null}
    </div>
  )
}
