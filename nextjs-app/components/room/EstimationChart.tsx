'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { calculateEstimationStats } from '@/lib/utils'
import type { Participant } from '@/lib/types'

interface EstimationChartProps {
  participants: Participant[]
  visible: boolean
}

export function EstimationChart({ participants, visible }: EstimationChartProps) {
  const stats = calculateEstimationStats(participants, visible)

  if (!visible || stats.distribution.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estimation Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-center text-muted-foreground">
            <div>
              <p className="text-4xl mb-2">🔒</p>
              <p>Estimations are hidden</p>
              <p className="text-sm mt-1">
                Admin can reveal when everyone has voted
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimation Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Min</p>
            <p className="text-2xl font-bold text-primary">
              {stats.min || '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Most Common</p>
            <p className="text-2xl font-bold text-secondary">
              {stats.mostCommon || '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Max</p>
            <p className="text-2xl font-bold text-primary">
              {stats.max || '-'}
            </p>
          </div>
        </div>

        {/* Bar chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.distribution}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="value"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                allowDecimals={false}
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution list */}
        <div className="space-y-1">
          <p className="text-sm font-medium">Distribution:</p>
          {stats.distribution.map((item) => (
            <div
              key={item.value}
              className="flex justify-between text-sm text-muted-foreground"
            >
              <span>{item.value}:</span>
              <span>
                {item.count} vote{item.count !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
