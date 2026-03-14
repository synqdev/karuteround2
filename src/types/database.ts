export type EntryCategory = 'Preference' | 'Treatment' | 'Lifestyle' | 'Physical' | 'Note'
export type ProfileRole = 'admin' | 'staff'

export interface Profile {
  id: string
  customer_id: string
  full_name: string | null
  role: ProfileRole
  created_at: string
}

export interface Customer {
  id: string
  customer_id: string
  name: string
  contact_info: string | null
  notes: string | null
  furigana: string | null
  phone: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export interface KaruteRecord {
  id: string
  customer_id: string
  client_id: string
  staff_profile_id: string | null
  session_date: string
  transcript: string | null
  summary: string | null
  created_at: string
  updated_at: string
}

export interface Entry {
  id: string
  karute_record_id: string
  customer_id: string
  category: EntryCategory
  title: string
  source_quote: string | null
  confidence_score: number | null
  is_manual: boolean
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at'>; Update: Partial<Profile> }
      customers: { Row: Customer; Insert: Omit<Customer, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Customer> }
      karute_records: { Row: KaruteRecord; Insert: Omit<KaruteRecord, 'id' | 'created_at' | 'updated_at'>; Update: Partial<KaruteRecord> }
      entries: { Row: Entry; Insert: Omit<Entry, 'id' | 'created_at'>; Update: Partial<Entry> }
    }
  }
}
