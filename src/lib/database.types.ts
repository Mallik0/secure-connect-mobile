
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: number
          user_id: string
          email: string
          first_name: string
          last_name: string
          phone: string
          created_at: string
          last_login: string
          updated_at?: string
        }
        Insert: {
          id?: number
          user_id: string
          email: string
          first_name: string
          last_name: string
          phone: string
          created_at: string
          last_login: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          email?: string
          first_name?: string
          last_name?: string
          phone?: string
          created_at?: string
          last_login?: string
          updated_at?: string
        }
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
  }
}
