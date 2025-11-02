// Middleware Supabase client
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from './database.types'

export const createClient = (req: NextRequest, res: NextResponse) => {
  return createMiddlewareClient<Database>({ req, res })
}
