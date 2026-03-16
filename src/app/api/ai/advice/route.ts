import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { summary, entries, locale } = await request.json()

    if (!summary && (!entries || entries.length === 0)) {
      return NextResponse.json({ advice: '' })
    }

    const langInstruction = locale === 'ja'
      ? 'Respond entirely in Japanese.'
      : 'Respond entirely in English.'

    const context = [
      summary ? `Session Summary: ${summary}` : '',
      entries?.length > 0
        ? `Entries:\n${entries.map((e: { category: string; title: string }) => `- [${e.category}] ${e.title}`).join('\n')}`
        : '',
    ].filter(Boolean).join('\n\n')

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for a salon/clinic. Based on the karute session data, generate practical advice for the next visit. Keep it to 2-3 sentences, focusing on what the staff should follow up on, check, or suggest to the customer. ${langInstruction}`,
        },
        { role: 'user', content: context },
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    const advice = completion.choices[0]?.message?.content ?? ''
    return NextResponse.json({ advice })
  } catch (error) {
    console.error('[/api/ai/advice]', error)
    return NextResponse.json({ advice: '', error: 'Failed to generate advice' }, { status: 500 })
  }
}
