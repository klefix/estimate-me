// Database types matching Supabase schema

export interface Profile {
  id: string // UUID from auth.users
  email: string | null
  display_name: string
  avatar_emoji: string
  created_at: string
  updated_at: string
}

export interface Room {
  id: string // UUID
  name: string
  slug: string // URL-friendly version
  owner_id: string | null // UUID reference to profiles
  estimation_values: string[] // Array like ['1','2','3','5','8','13','21','?']
  estimations_visible: boolean
  active: boolean
  created_at: string
  updated_at: string
}

export interface RoomParticipant {
  id: string // UUID
  room_id: string // UUID reference to rooms
  user_id: string // UUID reference to profiles
  is_admin: boolean
  joined_at: string
  last_seen_at: string
}

export interface Estimation {
  id: string // UUID
  room_id: string // UUID reference to rooms
  user_id: string // UUID reference to profiles
  value: string | null // Can be number string, '?', or null
  submitted_at: string
}

// Denormalized view for easy querying
export interface RoomState {
  room_id: string
  room_name: string
  room_slug: string
  estimation_values: string[]
  estimations_visible: boolean
  participants: Participant[]
}

export interface Participant {
  id: string
  user_id: string
  display_name: string
  avatar_emoji: string
  is_admin: boolean
  estimation: string | null | '✓' // ✓ means voted but hidden
  last_seen_at: string
}

// For Supabase Realtime presence
export interface PresenceState {
  user_id: string
  online_at: string
}

// Chart data types
export interface EstimationStats {
  value: string
  count: number
}

export interface EstimationSummary {
  min: string | null
  max: string | null
  mostCommon: string | null
  distribution: EstimationStats[]
}

// Auth types
export interface User {
  id: string
  email?: string
  user_metadata: {
    display_name?: string
    avatar_emoji?: string
  }
}

// API response types
export interface ApiResponse<T> {
  data?: T
  error?: string
}
