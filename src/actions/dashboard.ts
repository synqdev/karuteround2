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
 * Returns bars with start time derived from created_at and a fixed duration.
 */
export async function getBarsByDate(dateStr: string): Promise<DashboardBar[]> {
  const supabase = await createClient()

  // Query karute records created on the given date
  const startOfDay = `${dateStr}T00:00:00`
  const endOfDay = `${dateStr}T23:59:59`

  const { data, error } = await supabase
    .from('karute_records')
    .select(`
      id,
      staff_profile_id,
      created_at,
      summary,
      customers:client_id ( name )
    `)
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay)
    .order('created_at', { ascending: true })

  if (error || !data) return []

  return data.map((record) => {
    const createdAt = new Date(record.created_at)
    const startMinute = createdAt.getHours() * 60 + createdAt.getMinutes()

    // Use a default 15-minute duration for display
    const durationMinute = 15

    const customer = (record as unknown as { customers: { name: string } | null }).customers
    const customerName = customer?.name ?? ''

    // Title: time range
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
