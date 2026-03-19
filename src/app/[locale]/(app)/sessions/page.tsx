import { createClient } from '@/lib/supabase/server'
import { getActiveStaffId } from '@/lib/staff'
import { RecordingFlow } from '@/components/recording/RecordingFlow'
import type { CustomerOption } from '@/components/karute/CustomerCombobox'

export default async function SessionsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const activeStaffId = await getActiveStaffId()

  const { data: customersData } = await supabase
    .from('customers')
    .select('id, name')
    .order('name', { ascending: true })

  const customers: CustomerOption[] = (customersData ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }))

  // Fetch today's upcoming appointments for the active staff
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  let nextAppointment: { id: string; customerName: string; startTime: string; durationMinutes: number } | null = null

  if (activeStaffId) {
    const { data: appointments } = await sb
      .from('appointments')
      .select('id, start_time, duration_minutes, customers:client_id ( name )')
      .eq('staff_profile_id', activeStaffId)
      .gte('start_time', now.toISOString())
      .lte('start_time', todayEnd.toISOString())
      .order('start_time', { ascending: true })
      .limit(1)

    if (appointments && appointments.length > 0) {
      const a = appointments[0]
      nextAppointment = {
        id: a.id,
        customerName: (a.customers as { name: string } | null)?.name ?? 'Unknown',
        startTime: a.start_time,
        durationMinutes: a.duration_minutes,
      }
    }
  }

  return <RecordingFlow customers={customers} locale={locale} nextAppointment={nextAppointment} />
}
