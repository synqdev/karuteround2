import { AIChatPage } from '@/components/ai/AIChatPage'

export default async function AskAIPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <AIChatPage locale={locale} />
}
