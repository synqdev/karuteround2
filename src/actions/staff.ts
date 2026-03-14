'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { staffProfileSchema, type StaffProfileInput } from '@/lib/validations/staff'
import { getActiveStaffId } from '@/lib/staff'

/**
 * Creates a new staff profile.
 * Validates input with staffProfileSchema before inserting.
 */
export async function createStaff(data: StaffProfileInput): Promise<void> {
  const parsed = staffProfileSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((e) => e.message).join(', '))
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .insert([{ full_name: parsed.data.name }])

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
}

/**
 * Updates an existing staff profile's name.
 * Validates input with staffProfileSchema before updating.
 */
export async function updateStaff(id: string, data: StaffProfileInput): Promise<void> {
  const parsed = staffProfileSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((e) => e.message).join(', '))
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: parsed.data.name })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
}

/**
 * Deletes a staff profile with three guards:
 * 1. Blocks deletion of the last remaining staff member.
 * 2. Blocks deletion if the staff has attributed karute records.
 * 3. Auto-switches the active_staff_id cookie if the deleted staff was active.
 */
export async function deleteStaff(id: string): Promise<void> {
  const supabase = await createClient()

  // Guard 1: Block deletion if this is the last remaining staff member
  const { count: totalCount, error: countError } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })

  if (countError) throw new Error(countError.message)
  if ((totalCount ?? 0) <= 1) {
    throw new Error('Cannot delete the last staff member.')
  }

  // Guard 2: Block deletion if staff has attributed karute records
  const { count: recordCount, error: recordError } = await supabase
    .from('karute_records')
    .select('id', { count: 'exact', head: true })
    .eq('staff_profile_id', id)

  if (recordError) throw new Error(recordError.message)
  if ((recordCount ?? 0) > 0) {
    throw new Error(
      `This staff member has ${recordCount} karute record${recordCount === 1 ? '' : 's'} and cannot be deleted.`
    )
  }

  // Guard 3: Auto-switch active staff cookie if this staff member is currently active
  const activeStaffId = await getActiveStaffId()
  const isActiveMember = activeStaffId === id

  // Delete the staff profile
  const { error: deleteError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)

  if (deleteError) throw new Error(deleteError.message)

  // After deletion, auto-switch active staff to the first alphabetical remaining member
  if (isActiveMember) {
    const { data: remaining } = await supabase
      .from('profiles')
      .select('id')
      .order('full_name', { ascending: true })
      .limit(1)
      .single()

    if (remaining) {
      await setActiveStaff(remaining.id)
    }
  }

  revalidatePath('/settings')
  revalidatePath('/', 'layout')
}

/**
 * Writes the active_staff_id cookie.
 * Cookie is httpOnly: false so the header switcher UI can read it client-side.
 * 30-day expiry persists selection across browser sessions.
 *
 * Security note: This action only writes a cookie — it does not accept untrusted
 * client data for save operations. All karute save flows read staff_id from the
 * cookie via getActiveStaffId(), never from client form fields.
 */
export async function setActiveStaff(staffId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('active_staff_id', staffId, {
    httpOnly: false, // readable by JS for UI display
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  revalidatePath('/', 'layout')
}
