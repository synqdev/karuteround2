export default function AppointmentsLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between px-5 py-2.5">
        <div className="h-5 w-24 rounded bg-muted" />
        <div className="h-5 w-40 rounded bg-muted" />
      </div>
      <div className="space-y-2 px-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-2">
            <div className="h-[78px] w-[78px] rounded-[24px] bg-muted shrink-0" />
            <div className="flex-1 h-[78px] rounded-[24px] bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
