import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { EstimationStats, EstimationSummary, Participant } from './types'

/**
 * Merge Tailwind classes without conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate URL-friendly slug from room name
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}

/**
 * Calculate estimation statistics from participants
 */
export function calculateEstimationStats(
  participants: Participant[],
  visible: boolean
): EstimationSummary {
  // Filter out participants without estimations or with hidden estimations
  const validEstimations = participants
    .filter((p) => p.estimation && p.estimation !== '✓')
    .map((p) => p.estimation!)

  if (!visible || validEstimations.length === 0) {
    return {
      min: null,
      max: null,
      mostCommon: null,
      distribution: [],
    }
  }

  // Count occurrences of each estimation
  const counts = new Map<string, number>()
  validEstimations.forEach((est) => {
    counts.set(est, (counts.get(est) || 0) + 1)
  })

  // Convert to array for distribution
  const distribution: EstimationStats[] = Array.from(counts.entries()).map(
    ([value, count]) => ({ value, count })
  )

  // Sort by count descending for most common
  const sortedByCount = [...distribution].sort((a, b) => b.count - a.count)
  const mostCommon = sortedByCount[0]?.value || null

  // For min/max, try to parse as numbers (exclude '?' or non-numeric)
  const numericEstimations = validEstimations
    .filter((est) => !isNaN(Number(est)))
    .map(Number)

  let min: string | null = null
  let max: string | null = null

  if (numericEstimations.length > 0) {
    min = String(Math.min(...numericEstimations))
    max = String(Math.max(...numericEstimations))
  }

  return {
    min,
    max,
    mostCommon,
    distribution: distribution.sort((a, b) => {
      // Try to sort numerically first
      const aNum = Number(a.value)
      const bNum = Number(b.value)
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum
      }
      // Fallback to string sort
      return a.value.localeCompare(b.value)
    }),
  }
}

/**
 * Check if all participants have submitted estimations
 */
export function areAllEstimationsComplete(participants: Participant[]): boolean {
  if (participants.length === 0) return false

  return participants.every((p) => p.estimation && p.estimation !== null)
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

/**
 * Generate random room name
 */
const adjectives = [
  'Quick',
  'Lazy',
  'Happy',
  'Brave',
  'Clever',
  'Swift',
  'Bright',
  'Bold',
]
const nouns = [
  'Tiger',
  'Eagle',
  'Dolphin',
  'Phoenix',
  'Dragon',
  'Falcon',
  'Panther',
  'Wolf',
]

export function generateRandomRoomName(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 100)
  return `${adj}${noun}${num}`
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy:', err)
    return false
  }
}
