'use client'

import { Control, useController } from 'react-hook-form'
import { useTranslations } from 'next-intl'

interface ReviewHeaderProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
}

export function ReviewHeader({ control }: ReviewHeaderProps) {
  const t = useTranslations('review')

  const { field } = useController({
    control,
    name: 'summary',
  })

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('aiSummary')}
        </label>
      </div>
      <div className="p-4">
        <textarea
          {...field}
          rows={4}
          placeholder={t('aiSummaryPlaceholder')}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:border-ring transition-colors leading-relaxed"
        />
      </div>
    </div>
  )
}
