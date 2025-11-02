'use client'

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'

/**
 * Custom hook for room-related actions (mutations)
 * Provides functions to interact with the room state
 */
export function useRoomActions(roomId: string, userId: string) {
  const supabase = createClient()

  // Join a room (or create if doesn't exist)
  const joinRoom = useCallback(
    async (roomName: string) => {
      try {
        const slug = slugify(roomName)

        // Check if room exists
        let { data: existingRoom, error: fetchError } = await supabase
          .from('rooms')
          .select('id')
          .eq('slug', slug)
          .single()

        let currentRoomId = existingRoom?.id

        // Create room if it doesn't exist
        if (fetchError && fetchError.code === 'PGRST116') {
          const { data: newRoom, error: createError } = await supabase
            .from('rooms')
            .insert({
              name: roomName,
              slug,
              owner_id: userId,
            })
            .select('id')
            .single()

          if (createError) throw createError
          currentRoomId = newRoom.id
        } else if (fetchError) {
          throw fetchError
        }

        // Join the room
        const { error: joinError } = await supabase
          .from('room_participants')
          .upsert(
            {
              room_id: currentRoomId,
              user_id: userId,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: 'room_id,user_id' }
          )

        if (joinError) throw joinError

        return { success: true, roomId: currentRoomId, slug }
      } catch (err) {
        console.error('Error joining room:', err)
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to join room',
        }
      }
    },
    [userId, supabase]
  )

  // Leave the current room
  const leaveRoom = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('room_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId)

      if (error) throw error

      return { success: true }
    } catch (err) {
      console.error('Error leaving room:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to leave room',
      }
    }
  }, [roomId, userId, supabase])

  // Submit or update estimation
  const submitEstimation = useCallback(
    async (value: string | null) => {
      try {
        const { error } = await supabase.from('estimations').upsert(
          {
            room_id: roomId,
            user_id: userId,
            value,
            submitted_at: new Date().toISOString(),
          },
          { onConflict: 'room_id,user_id' }
        )

        if (error) throw error

        return { success: true }
      } catch (err) {
        console.error('Error submitting estimation:', err)
        return {
          success: false,
          error:
            err instanceof Error ? err.message : 'Failed to submit estimation',
        }
      }
    },
    [roomId, userId, supabase]
  )

  // Clear all estimations (admin only)
  const clearEstimations = useCallback(async () => {
    try {
      // Delete all estimations for this room
      const { error: deleteError } = await supabase
        .from('estimations')
        .delete()
        .eq('room_id', roomId)

      if (deleteError) throw deleteError

      // Hide estimations
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ estimations_visible: false })
        .eq('id', roomId)

      if (updateError) throw updateError

      return { success: true }
    } catch (err) {
      console.error('Error clearing estimations:', err)
      return {
        success: false,
        error:
          err instanceof Error ? err.message : 'Failed to clear estimations',
      }
    }
  }, [roomId, supabase])

  // Reveal estimations (admin only)
  const revealEstimations = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ estimations_visible: true })
        .eq('id', roomId)

      if (error) throw error

      return { success: true }
    } catch (err) {
      console.error('Error revealing estimations:', err)
      return {
        success: false,
        error:
          err instanceof Error ? err.message : 'Failed to reveal estimations',
      }
    }
  }, [roomId, supabase])

  // Set estimation values (admin only)
  const setEstimationValues = useCallback(
    async (values: string[]) => {
      try {
        const { error } = await supabase
          .from('rooms')
          .update({ estimation_values: values })
          .eq('id', roomId)

        if (error) throw error

        return { success: true }
      } catch (err) {
        console.error('Error setting estimation values:', err)
        return {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : 'Failed to set estimation values',
        }
      }
    },
    [roomId, supabase]
  )

  // Grant admin role to another user (admin only)
  const grantAdmin = useCallback(
    async (targetUserId: string) => {
      try {
        // Remove admin from current user
        const { error: revokeError } = await supabase
          .from('room_participants')
          .update({ is_admin: false })
          .eq('room_id', roomId)
          .eq('user_id', userId)

        if (revokeError) throw revokeError

        // Grant admin to target user
        const { error: grantError } = await supabase
          .from('room_participants')
          .update({ is_admin: true })
          .eq('room_id', roomId)
          .eq('user_id', targetUserId)

        if (grantError) throw grantError

        return { success: true }
      } catch (err) {
        console.error('Error granting admin:', err)
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to grant admin',
        }
      }
    },
    [roomId, userId, supabase]
  )

  return {
    joinRoom,
    leaveRoom,
    submitEstimation,
    clearEstimations,
    revealEstimations,
    setEstimationValues,
    grantAdmin,
  }
}
