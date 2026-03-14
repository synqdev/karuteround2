/**
 * Database type definitions for Karute v1.
 *
 * Format follows Supabase CLI output conventions (Supabase JS 2.99+):
 * - Explicit Insert/Update types (not Omit<Row, ...>) so Supabase's
 *   GenericTable constraint is satisfied and .insert()/.update() calls type-check.
 * - [_ in never]: never pattern for empty Views/Functions/Enums/CompositeTypes.
 *
 * Phase 4 data model:
 * - karute_records: customer_id (FK → customers.id), staff_id (FK → profiles.id), duration
 * - entries: content field, lowercase category values
 */

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          full_name?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: string
          created_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          name: string
          furigana: string | null
          phone: string | null
          email: string | null
          contact_info: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          furigana?: string | null
          phone?: string | null
          email?: string | null
          contact_info?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          furigana?: string | null
          phone?: string | null
          email?: string | null
          contact_info?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      karute_records: {
        Row: {
          id: string
          customer_id: string
          staff_id: string | null
          duration: number | null
          transcript: string | null
          summary: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          staff_id?: string | null
          duration?: number | null
          transcript?: string | null
          summary?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          staff_id?: string | null
          duration?: number | null
          transcript?: string | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'karute_records_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'karute_records_staff_id_fkey'
            columns: ['staff_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      entries: {
        Row: {
          id: string
          karute_record_id: string
          category: string
          content: string
          source_quote: string | null
          confidence_score: number | null
          is_manual: boolean
          created_at: string
        }
        Insert: {
          id?: string
          karute_record_id: string
          category: string
          content: string
          source_quote?: string | null
          confidence_score?: number | null
          is_manual?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          karute_record_id?: string
          category?: string
          content?: string
          source_quote?: string | null
          confidence_score?: number | null
          is_manual?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'entries_karute_record_id_fkey'
            columns: ['karute_record_id']
            isOneToOne: false
            referencedRelation: 'karute_records'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases derived from the Database type
export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type CustomerRow = Database['public']['Tables']['customers']['Row']
export type KaruteRecordRow = Database['public']['Tables']['karute_records']['Row']
export type EntryRow = Database['public']['Tables']['entries']['Row']

// Legacy named types for backward compatibility with existing imports
export type Profile = ProfileRow
export type Customer = CustomerRow
export type KaruteRecord = KaruteRecordRow
export type Entry = EntryRow

export type ProfileRole = 'admin' | 'staff'
