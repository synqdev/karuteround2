import { getTranslations } from 'next-intl/server'
import { LoginForm } from '@/components/login-form'

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('auth')
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Karute</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('subtitle')}</p>
        </div>
        <LoginForm locale={locale} />
      </div>
    </div>
  )
}
