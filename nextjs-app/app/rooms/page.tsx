'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function RoomsPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Your Rooms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Go back to the home page to create or join a room.
          </p>
          <Button onClick={() => router.push('/')} className="w-full">
            Go to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
