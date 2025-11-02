'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { RoomState } from '@/lib/types'

/**
 * Custom hook for real-time room state synchronization
 * Subscribes to changes in room participants, estimations, and room settings
 */
export function useRoomRealtime(roomId: string) {
  const supabase = createClient()
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  // Fetch current room state
  const fetchRoomState = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('room_state')
        .select('*')
        .eq('room_id', roomId)
        .single()

      if (fetchError) throw fetchError

      setRoomState(data as unknown as RoomState)
      setError(null)
    } catch (err) {
      console.error('Error fetching room state:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch room state')
    } finally {
      setLoading(false)
    }
  }, [roomId, supabase])

  useEffect(() => {
    // Initial fetch
    fetchRoomState()

    // Set up real-time subscription
    const roomChannel = supabase
      .channel(`room:${roomId}`)
      // Listen for participant changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          console.log('Participants changed, refetching room state')
          fetchRoomState()
        }
      )
      // Listen for estimation changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'estimations',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          console.log('Estimations changed, refetching room state')
          fetchRoomState()
        }
      )
      // Listen for room setting changes
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        () => {
          console.log('Room settings changed, refetching room state')
          fetchRoomState()
        }
      )
      .subscribe()

    setChannel(roomChannel)

    // Cleanup subscription on unmount
    return () => {
      console.log('Unsubscribing from room channel')
      supabase.removeChannel(roomChannel)
    }
  }, [roomId, supabase, fetchRoomState])

  return {
    roomState,
    loading,
    error,
    channel,
    refetch: fetchRoomState,
  }
}
