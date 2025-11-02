'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { copyToClipboard } from '@/lib/utils'

interface RoomHeaderProps {
  roomName: string
  onLeave: () => void
  userId: string
}

export function RoomHeader({ roomName, onLeave, userId }: RoomHeaderProps) {
  const supabase = createClient()
  const [displayName, setDisplayName] = useState('')
  const [copied, setCopied] = useState(false)

  const handleUpdateName = async () => {
    if (!displayName.trim()) return

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', userId)

    if (error) {
      console.error('Error updating name:', error)
    } else {
      setDisplayName('')
    }
  }

  const handleCopyLink = async () => {
    const success = await copyToClipboard(window.location.href)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b bg-card shadow-sm">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">{roomName}</h1>
          <p className="text-sm text-muted-foreground">Planning Poker Session</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <Input
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUpdateName()
                }
              }}
              className="w-40"
            />
            <Button onClick={handleUpdateName} size="sm" variant="secondary">
              Set Name
            </Button>
          </div>

          <Button onClick={handleCopyLink} size="sm" variant="outline">
            {copied ? '✓ Copied' : '🔗 Share'}
          </Button>

          <Button onClick={onLeave} size="sm" variant="destructive">
            Leave
          </Button>
        </div>
      </div>
    </header>
  )
}
