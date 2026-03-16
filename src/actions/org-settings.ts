'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

export interface OrgSettings {
  id: string
  salon_name: string
  business_type: string
  webhook_url: string
  ai_model: string
  confidence_threshold: number
  audio_quality: string
  auto_stop_minutes: number
}

export async function getOrgSettings(): Promise<OrgSettings | null> {
  const supabase = await createClient()
  const { data } = await (supabase as SupabaseAny)
    .from('organization_settings')
    .select('*')
    .limit(1)
    .single()

  return data as OrgSettings | null
}

export async function upsertOrgSettings(settings: Partial<OrgSettings>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if settings exist
  const existing = await getOrgSettings()

  if (existing) {
    const { error } = await (supabase as SupabaseAny)
      .from('organization_settings')
      .update(settings)
      .eq('id', existing.id)
    if (error) return { error: (error as { message: string }).message }
  } else {
    const { error } = await (supabase as SupabaseAny)
      .from('organization_settings')
      .insert({ ...settings, owner_profile_id: user.id })
    if (error) return { error: (error as { message: string }).message }
  }

  revalidatePath('/settings')
  return { success: true }
}
