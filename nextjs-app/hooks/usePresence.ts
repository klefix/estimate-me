'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface PresenceState {
  [key: string]: {
    user_id: string
    online_at: string
  }[]
}

/**
 * Custom hook for tracking user presence in a room
 * Uses Supabase Realtime Presence to show who's currently online
 */
export function usePresence(roomId: string, userId: string) {
  const supabase = createClient()
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  // Update last_seen_at timestamp
  const updateLastSeen = useCallback(async () => {
    if (!userId || !roomId) return

    try {
      await supabase
        .from('room_participants')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', userId)
    } catch (err) {
      console.error('Error updating last_seen_at:', err)
    }
  }, [roomId, userId, supabase])

  useEffect(() => {
    if (!userId || !roomId) return

    const presenceChannel = supabase.channel(`presence:${roomId}`)

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state: PresenceState = presenceChannel.presenceState()
        const users = Object.values(state)
          .flat()
          .map((presence) => presence.user_id)
        setOnlineUsers(users)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user's presence
          await presenceChannel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          })
        }
      })

    setChannel(presenceChannel)

    // Update last_seen_at periodically (every 30 seconds)
    updateLastSeen() // Initial update
    const interval = setInterval(updateLastSeen, 30000)

    // Cleanup on unmount
    return () => {
      console.log('Untracking presence')
      presenceChannel.untrack()
      supabase.removeChannel(presenceChannel)
      clearInterval(interval)
    }
  }, [roomId, userId, supabase, updateLastSeen])

  return { onlineUsers, channel }
}
