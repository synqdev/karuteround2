export default function KaruteDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex gap-6 border-b border-border pb-4">
        <div className="h-5 w-24 rounded bg-muted" />
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="h-5 w-20 rounded bg-muted" />
      </div>
      <div className="h-32 rounded-xl bg-muted" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="h-5 w-20 rounded bg-muted" />
          <div className="h-24 rounded-lg bg-muted" />
          <div className="h-24 rounded-lg bg-muted" />
        </div>
        <div className="space-y-3">
          <div className="h-5 w-28 rounded bg-muted" />
          <div className="h-32 rounded-lg bg-muted" />
          <div className="h-20 rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  )
}
