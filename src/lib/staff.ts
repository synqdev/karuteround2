import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface StaffMember {
  id: string
  full_name: string | null
  created_at: string
}

export interface StaffMemberBasic {
  id: string
  full_name: string | null
}

/**
 * Returns all staff profiles ordered alphabetically by full_name.
 * Returns an empty array on error (safe to render empty list).
 */
export async function getStaffList(): Promise<StaffMember[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, created_at')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('[getStaffList] Supabase error:', error.message)
    return []
  }

  return data ?? []
}

/**
 * Returns a single staff profile by ID, or null if not found.
 */
export async function getStaffById(id: string): Promise<StaffMemberBasic | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

/**
 * Reads the active_staff_id cookie server-side.
 * Returns the cookie value or null if not set.
 *
 * Usage in save actions: always read staff_id from here — never accept it from client.
 */
export async function getActiveStaffId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('active_staff_id')?.value ?? null
}
