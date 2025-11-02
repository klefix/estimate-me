import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { RoomClient } from './RoomClient'

export default async function RoomPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = createServerClient()

  // Get current user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect(`/login?redirect=/rooms/${params.slug}`)
  }

  // Check if room exists
  const { data: room, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (error || !room) {
    // Room doesn't exist yet - it will be created when user joins
    // This is expected behavior for new rooms
    console.log('Room not found, will be created on join:', params.slug)
  }

  return (
    <RoomClient
      roomSlug={params.slug}
      userId={session.user.id}
      initialRoom={room}
    />
  )
}
