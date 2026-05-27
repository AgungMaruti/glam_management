import { createClient, SupabaseClient } from '@supabase/supabase-js'

function createSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase env vars not set. Please fill in .env.local')
  
  return createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
}

// Singleton for browser
let _client: SupabaseClient | null = null

export function getClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Server-side: create new instance each time
    return createSupabaseClient()
  }
  if (!_client) {
    _client = createSupabaseClient()
  }
  return _client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient()
    return (client as unknown as Record<string, unknown>)[prop as string]
  },
})
