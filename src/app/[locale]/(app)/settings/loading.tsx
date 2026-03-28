export default function SettingsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-32 rounded-lg bg-muted" />
      <div className="flex gap-1 rounded-xl bg-muted/30 p-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-9 flex-1 rounded-lg bg-muted" />
        ))}
      </div>
      <div className="h-96 rounded-xl bg-muted" />
    </div>
  )
}
