import { createClient } from '@supabase/supabase-js'

// Cliente Supabase para uso no servidor (API routes, cron, etc.)
// Configurado com schema 'adtracker' dedicado ao projeto
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'adtracker',
  },
})
