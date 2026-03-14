import { getTranslations } from 'next-intl/server'
import { getStaffList, getActiveStaffId } from '@/lib/staff'
import { StaffList } from '@/components/staff/StaffList'

export default async function SettingsPage() {
  const [staffList, activeStaffId, t] = await Promise.all([
    getStaffList(),
    getActiveStaffId(),
    getTranslations('settings'),
  ])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>

      {/* Staff Members section */}
      <section className="space-y-4">
        <StaffList staffList={staffList} activeStaffId={activeStaffId} />
      </section>
    </div>
  )
}
