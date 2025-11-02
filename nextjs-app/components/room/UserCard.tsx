'use client'

import { useState } from 'react'
import { useRoomActions } from '@/hooks/useRoomActions'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Participant } from '@/lib/types'
import EmojiPicker from 'emoji-picker-react'

interface UserCardProps {
  participant: Participant
  isOnline: boolean
  currentUser: Participant | undefined
  roomId: string
}

export function UserCard({
  participant,
  isOnline,
  currentUser,
  roomId,
}: UserCardProps) {
  const supabase = createClient()
  const { grantAdmin } = useRoomActions(roomId, currentUser?.user_id || '')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const isCurrentUser = currentUser?.user_id === participant.user_id
  const canGrantAdmin = currentUser?.is_admin && !participant.is_admin

  const handleEmojiSelect = async (emojiObject: any) => {
    if (!isCurrentUser) return

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_emoji: emojiObject.emoji })
      .eq('id', participant.user_id)

    if (error) {
      console.error('Error updating emoji:', error)
    }

    setShowEmojiPicker(false)
  }

  const handleGrantAdmin = async () => {
    if (!canGrantAdmin) return
    await grantAdmin(participant.user_id)
  }

  return (
    <Card className="relative">
      <CardContent className="p-4">
        {/* Online indicator */}
        {isOnline && (
          <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-green-500" />
        )}

        {/* Admin crown */}
        {participant.is_admin && (
          <div className="absolute left-2 top-2 text-xl">👑</div>
        )}

        {/* Grant admin button (shadow crown) */}
        {canGrantAdmin && (
          <button
            onClick={handleGrantAdmin}
            className="absolute left-2 top-2 text-xl opacity-30 transition-opacity hover:opacity-100"
            title="Grant admin to this user"
          >
            👑
          </button>
        )}

        <div className="flex flex-col items-center space-y-2">
          {/* Avatar emoji */}
          <div className="relative">
            <button
              onClick={() => isCurrentUser && setShowEmojiPicker(!showEmojiPicker)}
              className={`text-5xl ${isCurrentUser ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
              title={isCurrentUser ? 'Click to change emoji' : ''}
            >
              {participant.avatar_emoji}
            </button>

            {showEmojiPicker && isCurrentUser && (
              <div className="absolute left-0 top-full z-50 mt-2">
                <EmojiPicker onEmojiClick={handleEmojiSelect} />
              </div>
            )}
          </div>

          {/* Display name */}
          <p className="text-center text-sm font-medium">
            {participant.display_name}
            {isCurrentUser && ' (You)'}
          </p>

          {/* Estimation value */}
          <div className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-primary bg-background">
            {participant.estimation === '✓' ? (
              <span className="text-2xl text-green-500">✓</span>
            ) : participant.estimation ? (
              <span className="text-xl font-bold text-primary">
                {participant.estimation}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">-</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
