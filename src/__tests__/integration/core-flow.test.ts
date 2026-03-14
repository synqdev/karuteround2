import { testSupabase, created, teardownTestData, createTestProfile } from './helpers/supabase'
import { TEST_STAFF_PROFILE_ID } from './helpers/server-action-mocks'

// Mock next/headers — cookies() returns active_staff_id for saveKaruteRecord
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn((name: string) => {
      if (name === 'active_staff_id') return { value: TEST_STAFF_PROFILE_ID }
      return undefined
    }),
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })),
}))

// Mock next/cache — revalidatePath is a no-op in tests
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

// Mock next/navigation — redirect() must NOT throw in tests
jest.mock('next/navigation', () => ({ redirect: jest.fn() }))

// CRITICAL: Mock @/lib/supabase/server to use testSupabase instead of cookie-based client
// This affects ALL server actions and query helpers (createCustomer, saveKaruteRecord, checkDuplicateName)
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(testSupabase)),
}))

import { createCustomer } from '@/actions/customers'
import { saveKaruteRecord } from '@/actions/karute'
import { redirect } from 'next/navigation'

describe('Core flow: create customer -> save karute -> verify -> teardown', () => {
  // Track the customer ID across test cases (tests run sequentially)
  let customerId: string

  beforeAll(async () => {
    // Insert a staff profile row that satisfies the FK constraint on karute_records.staff_profile_id
    await createTestProfile(TEST_STAFF_PROFILE_ID, 'Test Staff Member')
  })

  afterAll(async () => {
    // Safety net teardown — idempotent if teardown test already cleared the arrays
    await teardownTestData()
  })

  it('creates a customer via createCustomer server action', async () => {
    const result = await createCustomer({ name: 'Integration Test Customer' })

    expect(result.success).toBe(true)
    if (!result.success) throw new Error('Expected success')

    customerId = result.id
    created.customerIds.push(customerId)

    // Verify the row exists in Supabase directly
    const { data, error } = await testSupabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    expect(error).toBeNull()
    expect(data).not.toBeNull()
    expect(data!.name).toBe('Integration Test Customer')
  })

  it('saves a karute record with entries via saveKaruteRecord', async () => {
    // Depends on customerId from test 1
    expect(customerId).toBeDefined()

    const result = await saveKaruteRecord({
      customerId,
      transcript: 'Integration test transcript text',
      summary: 'Integration test summary',
      entries: [
        {
          category: 'symptom',
          content: 'Test symptom entry',
          sourceQuote: 'test transcript text',
          confidenceScore: 0.85,
        },
        {
          category: 'treatment',
          content: 'Test treatment entry',
          confidenceScore: 0.9,
        },
      ],
    })

    // saveKaruteRecord returns undefined on success (redirect was mocked)
    expect(result).toBeUndefined()

    // Verify redirect was called
    expect(redirect).toHaveBeenCalled()

    // Query the karute_records table to verify the record was created
    const { data: records, error: recordError } = await testSupabase
      .from('karute_records')
      .select('id, transcript, summary, client_id, staff_profile_id')
      .eq('client_id', customerId)

    expect(recordError).toBeNull()
    expect(records).toHaveLength(1)

    const record = records![0]
    expect(record.transcript).toBe('Integration test transcript text')
    expect(record.summary).toBe('Integration test summary')
    expect(record.staff_profile_id).toBe(TEST_STAFF_PROFILE_ID)

    // Track the record ID for teardown
    created.karuteRecordIds.push(record.id)
    const recordId = record.id

    // Query entries for this karute record
    const { data: entries, error: entriesError } = await testSupabase
      .from('entries')
      .select('id, category, content, confidence_score, karute_record_id')
      .eq('karute_record_id', recordId)

    expect(entriesError).toBeNull()
    expect(entries).toHaveLength(2)

    const categories = entries!.map((e) => e.category)
    expect(categories).toContain('symptom')
    expect(categories).toContain('treatment')

    // Track entry IDs for teardown
    entries!.forEach((entry) => created.entryIds.push(entry.id))
  })

  it('teardown removes all test data', async () => {
    // Snapshot IDs before teardown for post-teardown verification
    const recordIds = [...created.karuteRecordIds]
    const entryIds = [...created.entryIds]

    // Explicitly run teardown
    await teardownTestData()

    // Verify no customers with our test marker remain
    const { data: remainingCustomers } = await testSupabase
      .from('customers')
      .select('id')
      .ilike('name', '%Integration Test%')
    expect(remainingCustomers).toHaveLength(0)

    // Verify karute_records rows are gone
    if (recordIds.length > 0) {
      const { data: remainingRecords } = await testSupabase
        .from('karute_records')
        .select('id')
        .in('id', recordIds)
      expect(remainingRecords).toHaveLength(0)
    }

    // Verify entries rows are gone
    if (entryIds.length > 0) {
      const { data: remainingEntries } = await testSupabase
        .from('entries')
        .select('id')
        .in('id', entryIds)
      expect(remainingEntries).toHaveLength(0)
    }
  })
})
