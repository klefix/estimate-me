'use client'

import { useRoomActions } from '@/hooks/useRoomActions'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface EstimationGridProps {
  values: string[]
  currentEstimation: string | null | undefined
  roomId: string
  userId: string
}

export function EstimationGrid({
  values,
  currentEstimation,
  roomId,
  userId,
}: EstimationGridProps) {
  const { submitEstimation } = useRoomActions(roomId, userId)

  const handleEstimate = async (value: string) => {
    // Toggle off if clicking the same value
    if (currentEstimation === value) {
      await submitEstimation(null)
    } else {
      await submitEstimation(value)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Your Estimate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {values.map((value) => {
            const isSelected = currentEstimation === value
            return (
              <Button
                key={value}
                onClick={() => handleEstimate(value)}
                variant={isSelected ? 'default' : 'outline'}
                className="h-16 text-2xl font-bold"
              >
                {value}
              </Button>
            )
          })}
        </div>

        {currentEstimation && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            You estimated: <strong className="text-primary">{currentEstimation}</strong>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
