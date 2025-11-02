'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRoomRealtime } from '@/hooks/useRoomRealtime'
import { usePresence } from '@/hooks/usePresence'
import { useRoomActions } from '@/hooks/useRoomActions'
import { UserCard } from '@/components/room/UserCard'
import { EstimationGrid } from '@/components/room/EstimationGrid'
import { EstimationChart } from '@/components/room/EstimationChart'
import { AdminControls } from '@/components/room/AdminControls'
import { RoomHeader } from '@/components/room/RoomHeader'
import { Button } from '@/components/ui/Button'
import type { Room } from '@/lib/types'

interface RoomClientProps {
  roomSlug: string
  userId: string
  initialRoom: Room | null
}

export function RoomClient({ roomSlug, userId, initialRoom }: RoomClientProps) {
  const router = useRouter()
  const [joined, setJoined] = useState(false)
  const [roomId, setRoomId] = useState<string | null>(initialRoom?.id || null)
  const { joinRoom, leaveRoom } = useRoomActions(roomId || '', userId)

  const { roomState, loading, error } = useRoomRealtime(roomId || '')
  const { onlineUsers } = usePresence(roomId || '', userId)

  // Auto-join room on mount
  useEffect(() => {
    const autoJoin = async () => {
      if (joined) return

      const result = await joinRoom(roomSlug)
      if (result.success) {
        setRoomId(result.roomId!)
        setJoined(true)
      } else {
        console.error('Failed to join room:', result.error)
      }
    }

    autoJoin()
  }, [roomSlug, joinRoom, joined])

  const handleLeaveRoom = async () => {
    await leaveRoom()
    router.push('/')
  }

  if (loading || !roomState) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">⏳</div>
          <p className="text-muted-foreground">Loading room...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">❌</div>
          <p className="text-destructive">{error}</p>
          <Button onClick={() => router.push('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  const currentUser = roomState.participants.find((p) => p.user_id === userId)
  const isAdmin = currentUser?.is_admin || false

  return (
    <div className="min-h-screen bg-background">
      <RoomHeader
        roomName={roomState.room_name}
        onLeave={handleLeaveRoom}
        userId={userId}
      />

      <div className="container mx-auto p-4">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Main content area */}
          <div className="space-y-6">
            {/* Admin controls */}
            {isAdmin && (
              <AdminControls
                roomId={roomId!}
                currentValues={roomState.estimation_values}
              />
            )}

            {/* Estimation grid */}
            <EstimationGrid
              values={roomState.estimation_values}
              currentEstimation={currentUser?.estimation}
              roomId={roomId!}
              userId={userId}
            />

            {/* User cards */}
            <div>
              <h2 className="mb-4 text-xl font-semibold">
                Participants ({roomState.participants.length})
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {roomState.participants.map((participant) => (
                  <UserCard
                    key={participant.user_id}
                    participant={participant}
                    isOnline={onlineUsers.includes(participant.user_id)}
                    currentUser={currentUser}
                    roomId={roomId!}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar with chart */}
          <div className="space-y-6">
            <EstimationChart
              participants={roomState.participants}
              visible={roomState.estimations_visible}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
