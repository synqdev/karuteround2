export default function SessionsLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-pulse">
      <div className="h-[100px] w-full max-w-xs rounded bg-muted" />
      <div className="h-16 w-16 rounded-full bg-muted" />
      <div className="text-center space-y-2">
        <div className="h-7 w-32 rounded bg-muted mx-auto" />
        <div className="h-4 w-56 rounded bg-muted mx-auto" />
      </div>
      <div className="h-24 w-full max-w-sm rounded-xl bg-muted" />
    </div>
  )
}
