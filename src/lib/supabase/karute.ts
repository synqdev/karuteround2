import { createClient } from '@/lib/supabase/server'
import type { QueryData } from '@supabase/supabase-js'

/**
 * Reference query used to derive the KaruteWithRelations type.
 * Not called directly — createClient() is called per-request inside getKaruteRecord().
 * This pattern satisfies QueryData<> inference without a module-level client.
 */
const _karuteWithRelationsQuery = (supabase: ReturnType<typeof createClient>) =>
  supabase
    .from('karute_records')
    .select(
      `
      id,
      created_at,
      summary,
      transcript,
      customer_id,
      staff_id,
      duration,
      customers ( id, name ),
      entries (
        id,
        category,
        content,
        source_quote,
        confidence_score,
        is_manual,
        created_at
      )
    `,
    )
    .eq('id', '')
    .single()

/** Inferred TypeScript type for a karute record with nested customer and entries */
export type KaruteWithRelations = QueryData<
  ReturnType<typeof _karuteWithRelationsQuery>
>

/**
 * Fetch a single karute record with its related customer and entries.
 * Entries are ordered by created_at ascending so AI entries (inserted first)
 * appear before manually added entries in a consistent order.
 *
 * @throws {Error} if Supabase returns an error (propagates to the page for error boundaries)
 * @returns null if no record found with the given id
 */
export async function getKaruteRecord(
  id: string,
): Promise<KaruteWithRelations | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('karute_records')
    .select(
      `
      id,
      created_at,
      summary,
      transcript,
      customer_id,
      staff_id,
      duration,
      customers ( id, name ),
      entries (
        id,
        category,
        content,
        source_quote,
        confidence_score,
        is_manual,
        created_at
      )
    `,
    )
    .eq('id', id)
    .order('created_at', { foreignTable: 'entries', ascending: true })
    .single()

  if (error) {
    // PGRST116 = "The result contains 0 rows" — return null for notFound() handling
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }

  return data
}
