import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any

export async function GET() {
  const supabase = await createClient() as SB

  const { data } = await supabase
    .from('sync_config')
    .select('username, enabled, last_sync_at, last_sync_status, last_sync_error')
    .eq('provider', 'quickreserve')
    .single()

  if (!data) {
    return NextResponse.json({ username: '', enabled: false, lastStatus: null })
  }

  return NextResponse.json({
    username: data.username,
    enabled: data.enabled,
    lastStatus: data.last_sync_status
      ? `${data.last_sync_status}${data.last_sync_error ? ': ' + data.last_sync_error : ''} (${data.last_sync_at ? new Date(data.last_sync_at).toLocaleString() : 'never'})`
      : null,
  })
}

export async function POST(request: Request) {
  const { username, password, enabled } = await request.json()
  const supabase = await createClient() as SB

  // Check if config exists
  const { data: existing } = await supabase
    .from('sync_config')
    .select('id')
    .eq('provider', 'quickreserve')
    .single()

  if (existing) {
    // Update
    const updateData: Record<string, unknown> = {
      username,
      enabled,
      updated_at: new Date().toISOString(),
    }
    // Only update password if provided (don't overwrite with empty)
    if (password) updateData.password_encrypted = password

    await supabase
      .from('sync_config')
      .update(updateData)
      .eq('id', existing.id)
  } else {
    // Create
    await supabase
      .from('sync_config')
      .insert({
        provider: 'quickreserve',
        base_url: 'la-estro',
        username,
        password_encrypted: password || '',
        enabled,
      })
  }

  return NextResponse.json({ success: true })
}
