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
 * Fetch saved karute records for a given date to display as timeline bars.
 * Returns bars with start time derived from created_at in the client's timezone.
 *
 * @param dateStr - YYYY-MM-DD in the client's local timezone
 * @param tzOffsetMinutes - client's timezone offset in minutes (e.g., -420 for PST)
 */
export async function getBarsByDate(dateStr: string, tzOffsetMinutes: number = 0): Promise<DashboardBar[]> {
  const supabase = await createClient()

  // Convert local date boundaries to UTC for the query
  // tzOffsetMinutes is from Date.getTimezoneOffset() which is positive for west of UTC
  const startLocal = new Date(`${dateStr}T00:00:00`)
  startLocal.setMinutes(startLocal.getMinutes() + tzOffsetMinutes)
  const endLocal = new Date(`${dateStr}T23:59:59`)
  endLocal.setMinutes(endLocal.getMinutes() + tzOffsetMinutes)

  const { data, error } = await supabase
    .from('karute_records')
    .select(`
      id,
      staff_profile_id,
      created_at,
      summary,
      customers:client_id ( name )
    `)
    .gte('created_at', startLocal.toISOString())
    .lte('created_at', endLocal.toISOString())
    .order('created_at', { ascending: true })

  if (error || !data) return []

  return data.map((record) => {
    // created_at is UTC — convert to local time for timeline display
    const createdAt = new Date(record.created_at)
    const localHours = createdAt.getHours()
    const localMinutes = createdAt.getMinutes()
    const startMinute = localHours * 60 + localMinutes

    const durationMinute = 15

    const customer = (record as unknown as { customers: { name: string } | null }).customers
    const customerName = customer?.name ?? ''

    const startH = Math.floor(startMinute / 60)
    const startM = startMinute % 60
    const endMin = startMinute + durationMinute
    const endH = Math.floor(endMin / 60)
    const endM = endMin % 60
    const title = `${startH}:${String(startM).padStart(2, '0')}-${endH}:${String(endM).padStart(2, '0')}`

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
