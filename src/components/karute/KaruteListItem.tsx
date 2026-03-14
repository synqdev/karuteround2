import Link from 'next/link'

interface KaruteListItemProps {
  id: string
  customerName: string
  createdAt: string
  entryCount: number
  summary: string | null
  locale: string
}

/**
 * Single row in the karute records list.
 *
 * Displays customer name, date, entry count, and a short summary preview.
 * The entire card is a link to /karute/[id] detail view.
 */
export function KaruteListItem({
  id,
  customerName,
  createdAt,
  entryCount,
  summary,
  locale,
}: KaruteListItemProps) {
  const date = new Date(createdAt).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const summaryPreview =
    summary && summary.length > 80 ? summary.slice(0, 80) + '…' : summary ?? ''

  return (
    <Link
      href={`/${locale}/karute/${id}`}
      className="block rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{customerName}</p>
          {summaryPreview && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{summaryPreview}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-sm text-muted-foreground">{date}</span>
          <span className="text-xs text-muted-foreground">
            {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      </div>
    </Link>
  )
}
