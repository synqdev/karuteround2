export default function KaruteLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-32 rounded-lg bg-muted" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 rounded-lg bg-muted" />
      ))}
    </div>
  )
}
