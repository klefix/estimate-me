'use client'

import { useState } from 'react'
import { useRoomActions } from '@/hooks/useRoomActions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface AdminControlsProps {
  roomId: string
  currentValues: string[]
}

export function AdminControls({ roomId, currentValues }: AdminControlsProps) {
  const { clearEstimations, revealEstimations, setEstimationValues } =
    useRoomActions(roomId, '')
  const [newValues, setNewValues] = useState(currentValues.join(','))

  const handleSetValues = async () => {
    const values = newValues
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)

    if (values.length === 0) {
      alert('Please enter at least one estimation value')
      return
    }

    await setEstimationValues(values)
  }

  const handleClear = async () => {
    if (confirm('Clear all estimations?')) {
      await clearEstimations()
    }
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>👑</span>
          Admin Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estimation values configuration */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Estimation Values</label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="e.g., 1,2,3,5,8,13,21,?"
              value={newValues}
              onChange={(e) => setNewValues(e.target.value)}
            />
            <Button onClick={handleSetValues} variant="secondary">
              Set
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Comma-separated values (e.g., 0,1,2,3,5,8,13,21,?)
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={revealEstimations} variant="secondary">
            👁️ Reveal Estimations
          </Button>
          <Button onClick={handleClear} variant="destructive">
            🗑️ Clear Estimations
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
