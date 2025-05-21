
import { createClient } from '@supabase/supabase-js';
import { Database } from '../database.types';

// Use the actual Supabase project URL and key
const supabaseUrl = 'https://ntlrvofjorgmukdfhkah.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50bHJ2b2Zqb3JnbXVrZGZoa2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczODY1MTAsImV4cCI6MjA2Mjk2MjUxMH0.qqThciE7l4XfX9yGBXSbBYe4natEEQGlIxL9YRcVa8g';

// Set session expiration to 30 days (increased from 7 days)
export const sessionExpiryDays = 30;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
