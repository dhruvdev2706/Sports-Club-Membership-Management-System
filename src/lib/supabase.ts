import { createClient } from '@supabase/supabase-js';

// Default to the project's cloud Supabase instance if environment variables are not injected during build
const DEFAULT_SUPABASE_URL = 'https://eqbwmngyoohvbhctedvs.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxYndtbmd5b29odmJoY3RlZHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NTQ4MTgsImV4cCI6MjEwNzIzMDgxOH0.AAzukE_S1lBjwjPfwSItJR40pO0coaPu7TG9v7V5OKI';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.trim() !== '')
  ? import.meta.env.VITE_SUPABASE_URL
  : DEFAULT_SUPABASE_URL;

const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY.trim() !== '')
  ? import.meta.env.VITE_SUPABASE_ANON_KEY
  : DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

