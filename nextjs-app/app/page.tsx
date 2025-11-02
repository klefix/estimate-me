'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { generateRandomRoomName, slugify } from '@/lib/utils'

export default function Home() {
  const router = useRouter()
  const [roomName, setRoomName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleJoinRoom = () => {
    if (!roomName.trim()) {
      setError('Please enter a room name')
      return
    }

    // Validate alphanumeric
    if (!/^[a-zA-Z0-9\s-]+$/.test(roomName)) {
      setError('Room name can only contain letters, numbers, spaces, and hyphens')
      return
    }

    const slug = slugify(roomName)
    router.push(`/rooms/${slug}`)
  }

  const handleRandomRoom = () => {
    const randomName = generateRandomRoomName()
    const slug = slugify(randomName)
    router.push(`/rooms/${slug}`)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-primary">Estimate Me</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Real-time planning poker for agile teams
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join or Create a Room</CardTitle>
          <CardDescription>
            Enter a room name to get started. The first person to join becomes
            the admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Room name"
              value={roomName}
              onChange={(e) => {
                setRoomName(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleJoinRoom()
                }
              }}
            />
            <Button onClick={handleRandomRoom} variant="outline">
              🎲
            </Button>
          </div>

          <Button onClick={handleJoinRoom} className="w-full">
            Create or Join Room
          </Button>

          <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            <p className="font-semibold">How it works:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Create or join a room with your team</li>
              <li>The first person becomes the admin</li>
              <li>Everyone submits their estimate</li>
              <li>Results auto-reveal when all have voted</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-sm text-muted-foreground">
        <Button variant="link" onClick={() => router.push('/login')}>
          Sign in
        </Button>
        {' · '}
        Built with Supabase + Next.js
      </div>
    </div>
  )
}
