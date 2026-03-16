'use server'

import { createClient } from '@/lib/supabase/server'

export interface DashboardBar {
  id: string
  staffId: string
  startMinute: number
  durationMinute: number
  title: string
  subtitle?: string
  customerName?: string
}

/**
 * Convert a UTC Date to local hours+minutes using the client's timezone offset.
 * On the server (Vercel UTC), Date.getHours() returns UTC hours.
 * We subtract tzOffsetMinutes to get the client's local time.
 *
 * getTimezoneOffset() returns positive for west of UTC (e.g., 420 for PST).
 * So local = UTC - offset.
 */
function utcToLocalMinute(utcDate: Date, tzOffsetMinutes: number): number {
  const utcMinutes = utcDate.getUTCHours() * 60 + utcDate.getUTCMinutes()
  // tzOffsetMinutes is positive for west of UTC, so subtract to get local
  let localMinutes = utcMinutes - tzOffsetMinutes
  if (localMinutes < 0) localMinutes += 1440
  if (localMinutes >= 1440) localMinutes -= 1440
  return localMinutes
}

function formatTimeRange(startMin: number, endMin: number): string {
  const h1 = Math.floor(startMin / 60)
  const m1 = startMin % 60
  const h2 = Math.floor(endMin / 60)
  const m2 = endMin % 60
  return `${h1}:${String(m1).padStart(2, '0')}-${h2}:${String(m2).padStart(2, '0')}`
}

export async function getBarsByDate(dateStr: string, tzOffsetMinutes: number = 0): Promise<DashboardBar[]> {
  const supabase = await createClient()

  // Build UTC boundaries for the client's local day
  // Client's midnight = UTC midnight + offset
  const dayStartUTC = new Date(`${dateStr}T00:00:00Z`)
  dayStartUTC.setUTCMinutes(dayStartUTC.getUTCMinutes() + tzOffsetMinutes)
  const dayEndUTC = new Date(`${dateStr}T23:59:59Z`)
  dayEndUTC.setUTCMinutes(dayEndUTC.getUTCMinutes() + tzOffsetMinutes)

  const { data, error } = await supabase
    .from('karute_records')
    .select(`
      id,
      staff_profile_id,
      created_at,
      summary,
      customers:client_id ( name )
    `)
    .gte('created_at', dayStartUTC.toISOString())
    .lte('created_at', dayEndUTC.toISOString())
    .order('created_at', { ascending: true })

  if (error || !data) return []

  return data.map((record) => {
    const createdAt = new Date(record.created_at)
    const startMinute = utcToLocalMinute(createdAt, tzOffsetMinutes)
    const durationMinute = 15

    const customer = (record as unknown as { customers: { name: string } | null }).customers
    const customerName = customer?.name ?? ''
    const title = formatTimeRange(startMinute, startMinute + durationMinute)

    return {
      id: record.id,
      staffId: record.staff_profile_id ?? '',
      startMinute,
      durationMinute,
      title,
      subtitle: customerName,
      customerName,
    }
  })
}
