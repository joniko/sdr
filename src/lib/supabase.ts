import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Lazy initialization to avoid build-time errors
export const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

export const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin configuration');
  }
  
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// For backwards compatibility and client-side usage
export const supabase = typeof window !== 'undefined' ? getSupabase() : null as any;
export const supabaseAdmin = typeof window !== 'undefined' ? null : null as any;

export type SupabaseClient = typeof supabase; 