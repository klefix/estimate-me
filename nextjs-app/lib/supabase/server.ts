// Server-side Supabase client (for Server Components and API routes)
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies })
}
