# Supabase + Next.js Migration Plan

## Executive Summary

This plan outlines the migration of the Estimate-me Planning Poker application from a custom NestJS backend with Socket.IO to a modern Supabase + Next.js architecture. The migration will enable:

- **Persistent data storage** (Postgres instead of in-memory)
- **Built-in authentication** (Supabase Auth instead of role-based)
- **Simplified real-time** (Supabase Realtime instead of Socket.IO)
- **Easier deployment** (Vercel for frontend, Supabase cloud for backend)
- **Future billing integration** (Stripe via Vercel or Supabase Edge Functions)

---

## Current Architecture

### Tech Stack
- **Backend:** NestJS + Socket.IO + In-memory Maps
- **Frontend:** Vue 2 + Socket.IO Client + Vue Router
- **Deployment:** Custom HTTPS server (SSL certificates required)
- **Authentication:** Simple role-based (admin/user)
- **Data Persistence:** None (all data lost on restart)

### Core Features
1. Real-time planning poker sessions
2. Room creation/joining
3. Estimation voting with auto-reveal
4. Admin controls (set values, clear, reveal)
5. User presence (name, emoji, estimation status)
6. Chart visualization (estimation distribution)
7. Theme system (3 themes with localStorage)

### WebSocket Events (Socket.IO)
**Server → Client:**
- `joinedRoom`, `userList`, `estimationValuesUpdated`, `estimationsCleared`

**Client → Server:**
- `joinRoom`, `setName`, `setEstimation`, `setIcon`, `setEstimationValues`, `clearEstimations`, `revealEstimations`, `grantAdmin`

---

## Target Architecture

### Tech Stack
- **Backend:** Supabase (Postgres + Realtime + Auth + Edge Functions)
- **Frontend:** Next.js 14+ (App Router) + React + TypeScript
- **Deployment:** Vercel (frontend), Supabase Cloud (backend)
- **Authentication:** Supabase Auth (Email/Google/GitHub)
- **Data Persistence:** Supabase Postgres with Row Level Security (RLS)
- **Real-time:** Supabase Realtime (Postgres changes)

### Architecture Benefits
✅ No custom backend to maintain
✅ Automatic database persistence
✅ Built-in authentication & authorization
✅ Scalable infrastructure (Supabase + Vercel)
✅ Edge deployment for low latency
✅ Easy billing integration via Vercel/Stripe
✅ TypeScript end-to-end

---

## Phase 1: Database Schema Design

### Supabase Postgres Tables

#### 1. `profiles` (User Profiles)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT NOT NULL DEFAULT 'Anonymous',
  avatar_emoji TEXT DEFAULT '🧑‍💻',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### 2. `rooms` (Estimation Rooms)
```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE, -- URL-friendly version
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  estimation_values TEXT[] DEFAULT ARRAY['1','2','3','5','8','13','21','?'],
  estimations_visible BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rooms_slug ON rooms(slug);
CREATE INDEX idx_rooms_active ON rooms(active);

-- RLS Policies
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rooms are viewable by everyone"
  ON rooms FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Room owners can update their rooms"
  ON rooms FOR UPDATE
  USING (auth.uid() = owner_id);
```

#### 3. `room_participants` (Who's in each room)
```sql
CREATE TABLE room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(room_id, user_id)
);

-- Indexes
CREATE INDEX idx_participants_room ON room_participants(room_id);
CREATE INDEX idx_participants_user ON room_participants(user_id);
CREATE INDEX idx_participants_last_seen ON room_participants(last_seen_at);

-- RLS Policies
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants visible to room members"
  ON room_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants rp
      WHERE rp.room_id = room_participants.room_id
      AND rp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join rooms"
  ON room_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON room_participants FOR UPDATE
  USING (auth.uid() = user_id);
```

#### 4. `estimations` (User Votes)
```sql
CREATE TABLE estimations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  value TEXT, -- Can be number or '?' or null
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(room_id, user_id)
);

-- Indexes
CREATE INDEX idx_estimations_room ON estimations(room_id);
CREATE INDEX idx_estimations_user ON estimations(user_id);

-- RLS Policies
ALTER TABLE estimations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Estimations visible to room members"
  ON estimations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants rp
      WHERE rp.room_id = estimations.room_id
      AND rp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own estimations"
  ON estimations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own estimations"
  ON estimations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own estimations"
  ON estimations FOR DELETE
  USING (auth.uid() = user_id);
```

#### 5. Database Functions

**Auto-promote admin when first user joins:**
```sql
CREATE OR REPLACE FUNCTION auto_promote_first_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is the first participant in the room, make them admin
  IF NOT EXISTS (
    SELECT 1 FROM room_participants
    WHERE room_id = NEW.room_id
    AND id != NEW.id
  ) THEN
    NEW.is_admin := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_promote_admin
  BEFORE INSERT ON room_participants
  FOR EACH ROW
  EXECUTE FUNCTION auto_promote_first_admin();
```

**Auto-reveal when all users estimate:**
```sql
CREATE OR REPLACE FUNCTION check_auto_reveal()
RETURNS TRIGGER AS $$
DECLARE
  participant_count INT;
  estimation_count INT;
BEGIN
  -- Count participants and estimations in the room
  SELECT COUNT(*) INTO participant_count
  FROM room_participants
  WHERE room_id = NEW.room_id;

  SELECT COUNT(*) INTO estimation_count
  FROM estimations
  WHERE room_id = NEW.room_id
  AND value IS NOT NULL;

  -- If everyone has estimated, auto-reveal
  IF participant_count = estimation_count AND participant_count > 0 THEN
    UPDATE rooms
    SET estimations_visible = true
    WHERE id = NEW.room_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_reveal
  AFTER INSERT OR UPDATE ON estimations
  FOR EACH ROW
  EXECUTE FUNCTION check_auto_reveal();
```

**Clean up inactive rooms (cron job):**
```sql
CREATE OR REPLACE FUNCTION cleanup_inactive_rooms()
RETURNS void AS $$
BEGIN
  -- Mark rooms as inactive if no one has been active in 24 hours
  UPDATE rooms
  SET active = false
  WHERE id IN (
    SELECT r.id
    FROM rooms r
    LEFT JOIN room_participants rp ON r.id = rp.room_id
    WHERE r.active = true
    GROUP BY r.id
    HAVING MAX(rp.last_seen_at) < NOW() - INTERVAL '24 hours'
    OR COUNT(rp.id) = 0
  );
END;
$$ LANGUAGE plpgsql;
```

### Database Views for Realtime

**View: `room_state` (denormalized for easy querying)**
```sql
CREATE VIEW room_state AS
SELECT
  r.id AS room_id,
  r.name AS room_name,
  r.slug AS room_slug,
  r.estimation_values,
  r.estimations_visible,
  json_agg(
    json_build_object(
      'id', p.id,
      'user_id', rp.user_id,
      'display_name', p.display_name,
      'avatar_emoji', p.avatar_emoji,
      'is_admin', rp.is_admin,
      'estimation', CASE
        WHEN r.estimations_visible THEN e.value
        WHEN e.value IS NOT NULL THEN '✓' -- Checkmark if voted but hidden
        ELSE NULL
      END,
      'last_seen_at', rp.last_seen_at
    )
    ORDER BY rp.joined_at
  ) FILTER (WHERE rp.user_id IS NOT NULL) AS participants
FROM rooms r
LEFT JOIN room_participants rp ON r.id = rp.room_id
LEFT JOIN profiles p ON rp.user_id = p.id
LEFT JOIN estimations e ON r.id = e.room_id AND rp.user_id = e.user_id
WHERE r.active = true
GROUP BY r.id;
```

---

## Phase 2: Authentication Implementation

### Supabase Auth Setup

#### 1. Enable Auth Providers
```typescript
// In Supabase Dashboard:
// - Enable Email/Password
// - Enable Google OAuth (optional)
// - Enable GitHub OAuth (optional)
// - Configure email templates
// - Set up email verification
```

#### 2. Auth Flow in Next.js

**Middleware for protected routes:**
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Redirect to login if not authenticated
  if (!session && req.nextUrl.pathname.startsWith('/rooms')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/rooms/:path*']
}
```

**Sign in component:**
```typescript
// app/login/page.tsx
'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  const handleEmailSignIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error) {
      router.push('/rooms')
    }
  }

  // UI implementation...
}
```

#### 3. Guest Access (Optional)

For seamless onboarding, allow anonymous users with upgrade prompt:

```typescript
// Create anonymous session
const { data, error } = await supabase.auth.signInAnonymously()

// Prompt to sign up to save history
<Banner>
  Sign up to save your estimation history and create persistent rooms!
</Banner>
```

---

## Phase 3: Real-time Subscriptions

### Replace Socket.IO with Supabase Realtime

#### 1. Frontend Realtime Setup

```typescript
// hooks/useRoomRealtime.ts
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useRoomRealtime(roomId: string) {
  const supabase = createClientComponentClient()
  const [roomState, setRoomState] = useState(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    // Subscribe to room changes
    const roomChannel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          // Refetch room state when participants change
          fetchRoomState()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'estimations',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          // Refetch room state when estimations change
          fetchRoomState()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        () => {
          // Refetch room state when room settings change
          fetchRoomState()
        }
      )
      .subscribe()

    setChannel(roomChannel)
    fetchRoomState()

    return () => {
      supabase.removeChannel(roomChannel)
    }
  }, [roomId])

  const fetchRoomState = async () => {
    const { data } = await supabase
      .from('room_state')
      .select('*')
      .eq('room_id', roomId)
      .single()

    setRoomState(data)
  }

  return { roomState, channel }
}
```

#### 2. Presence Tracking

Use Supabase Realtime Presence for "who's online":

```typescript
// hooks/usePresence.ts
export function usePresence(roomId: string, userId: string) {
  const supabase = createClientComponentClient()
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`)

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = Object.keys(state)
        setOnlineUsers(users)
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log('User joined:', key)
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log('User left:', key)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          })
        }
      })

    // Update last_seen_at periodically
    const interval = setInterval(async () => {
      await supabase
        .from('room_participants')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', userId)
    }, 30000) // Every 30 seconds

    return () => {
      channel.unsubscribe()
      clearInterval(interval)
    }
  }, [roomId, userId])

  return onlineUsers
}
```

#### 3. Event Mapping (Socket.IO → Supabase)

| Old Socket.IO Event | New Supabase Action |
|---------------------|---------------------|
| `joinRoom` | `INSERT INTO room_participants` |
| `setName` | `UPDATE profiles SET display_name` |
| `setEstimation` | `UPSERT INTO estimations` |
| `setIcon` | `UPDATE profiles SET avatar_emoji` |
| `setEstimationValues` | `UPDATE rooms SET estimation_values` |
| `clearEstimations` | `DELETE FROM estimations WHERE room_id` |
| `revealEstimations` | `UPDATE rooms SET estimations_visible = true` |
| `grantAdmin` | `UPDATE room_participants SET is_admin` + RLS check |
| `userList` | Realtime subscription to `room_state` view |

---

## Phase 4: Next.js Frontend Migration

### Project Structure

```
nextjs-app/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Landing page
│   ├── login/
│   │   └── page.tsx           # Sign in/up page
│   ├── rooms/
│   │   ├── page.tsx           # Room list/create
│   │   └── [slug]/
│   │       └── page.tsx       # Room session view
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts       # OAuth callback handler
│   └── api/
│       └── rooms/
│           └── route.ts       # Server actions for room operations
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── room/
│   │   ├── EstimationGrid.tsx
│   │   ├── UserCard.tsx
│   │   ├── AdminControls.tsx
│   │   ├── EstimationChart.tsx
│   │   └── RoomHeader.tsx
│   └── layout/
│       ├── Navbar.tsx
│       └── ThemeProvider.tsx
├── hooks/
│   ├── useRoomRealtime.ts
│   ├── usePresence.ts
│   └── useSupabase.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server client
│   │   └── middleware.ts      # Middleware client
│   ├── types.ts               # TypeScript types
│   └── utils.ts               # Utility functions
├── middleware.ts               # Auth middleware
└── tailwind.config.ts          # Tailwind + theme config
```

### Component Migration Guide

#### Vue → React Component Mapping

| Vue Component | Next.js Component | Notes |
|---------------|-------------------|-------|
| `intro.vue` | `app/page.tsx` | Landing page with room join |
| `room.vue` | `app/rooms/[slug]/page.tsx` | Main room view |
| `baseButton.vue` | `components/ui/Button.tsx` | Use shadcn/ui Button |
| `userCard.vue` | `components/room/UserCard.tsx` | React + emoji picker |
| `adminControls.vue` | `components/room/AdminControls.tsx` | Supabase mutations |
| `estimationValues.vue` | `components/room/EstimationGrid.tsx` | Grid layout |
| `estimationChart.vue` | `components/room/EstimationChart.tsx` | Recharts or Chart.js |
| `userControls.vue` | `components/room/UserControls.tsx` | Profile updates |
| `settingsPanel.vue` | `components/layout/ThemeProvider.tsx` | next-themes |
| `app-header.vue` | `components/layout/Navbar.tsx` | Sticky header |

#### Example: Room Page Component

```typescript
// app/rooms/[slug]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { RoomClient } from './RoomClient'

export default async function RoomPage({ params }: { params: { slug: string } }) {
  const supabase = createServerComponentClient({ cookies })

  // Fetch initial room state on server
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!room) {
    return <div>Room not found</div>
  }

  // Get current user session
  const { data: { session } } = await supabase.auth.getSession()

  return <RoomClient initialRoom={room} session={session} />
}
```

```typescript
// app/rooms/[slug]/RoomClient.tsx
'use client'

import { useRoomRealtime } from '@/hooks/useRoomRealtime'
import { usePresence } from '@/hooks/usePresence'
import { EstimationGrid } from '@/components/room/EstimationGrid'
import { UserCard } from '@/components/room/UserCard'
import { AdminControls } from '@/components/room/AdminControls'
import { EstimationChart } from '@/components/room/EstimationChart'

export function RoomClient({ initialRoom, session }) {
  const { roomState } = useRoomRealtime(initialRoom.id)
  const onlineUsers = usePresence(initialRoom.id, session.user.id)

  const currentUser = roomState?.participants?.find(
    p => p.user_id === session.user.id
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4">
      {/* Admin Controls (if admin) */}
      {currentUser?.is_admin && (
        <AdminControls roomId={initialRoom.id} />
      )}

      {/* Estimation Grid */}
      <EstimationGrid
        values={roomState?.estimation_values}
        currentEstimation={currentUser?.estimation}
        roomId={initialRoom.id}
        userId={session.user.id}
      />

      {/* Chart */}
      <EstimationChart
        participants={roomState?.participants}
        visible={roomState?.estimations_visible}
      />

      {/* User Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {roomState?.participants?.map(participant => (
          <UserCard
            key={participant.user_id}
            participant={participant}
            isOnline={onlineUsers.includes(participant.user_id)}
            currentUser={currentUser}
          />
        ))}
      </div>
    </div>
  )
}
```

### State Management

**Option 1: React Context + Hooks (Recommended)**
- Use React Context for global state (theme, user)
- Custom hooks for Supabase queries/mutations
- Realtime hooks manage their own state

**Option 2: Zustand (if complex state needed)**
```typescript
// store/roomStore.ts
import { create } from 'zustand'

interface RoomStore {
  roomState: RoomState | null
  setRoomState: (state: RoomState) => void
  submitEstimation: (value: string) => Promise<void>
  clearEstimations: () => Promise<void>
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  roomState: null,
  setRoomState: (state) => set({ roomState: state }),
  submitEstimation: async (value) => {
    // Supabase mutation
  },
  clearEstimations: async () => {
    // Supabase mutation
  },
}))
```

### Styling Migration

**Current:** Vue + SCSS + CSS Variables
**Target:** Tailwind CSS + shadcn/ui + next-themes

**Theme Configuration:**
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'cpt-obvious': {
          primary: '#2680c2',
          secondary: '#17b897',
          danger: '#d64545',
        },
        'neumorpheus': {
          bg: '#e0e5ec',
          shadow: '#a3b1c6',
        },
        'c64': {
          bg: '#3f51b5',
          text: '#9fa8da',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

**Theme Provider:**
```typescript
// components/layout/ThemeProvider.tsx
'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="cpt-obvious"
      themes={['cpt-obvious', 'neumorpheus', 'c64', 'dark']}
    >
      {children}
    </NextThemesProvider>
  )
}
```

---

## Phase 5: Deployment

### Supabase Setup

1. **Create Supabase Project**
   ```bash
   # Sign up at https://supabase.com
   # Create new project
   # Note: Project URL and anon key
   ```

2. **Run Migrations**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Link to project
   supabase link --project-ref YOUR_PROJECT_REF

   # Run migrations
   supabase db push
   ```

3. **Configure Auth**
   - Enable Email provider
   - Add OAuth providers (Google, GitHub)
   - Set up email templates
   - Configure redirect URLs for Vercel domain

4. **Set up Edge Functions (if needed)**
   ```bash
   supabase functions new cleanup-rooms
   # Deploy cron job for room cleanup
   ```

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Environment Variables**
   ```env
   # .env.local (add to Vercel dashboard)
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # Server-only
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Configure Domain**
   - Add custom domain in Vercel dashboard
   - Update Supabase Auth redirect URLs

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## Phase 6: Future Enhancements

### Billing Integration

**Option 1: Vercel + Stripe**
```typescript
// app/api/create-checkout-session/route.ts
import Stripe from 'stripe'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer_email: session.user.email,
    line_items: [
      {
        price: 'price_XXXXX', // Pro plan price ID
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${req.headers.get('origin')}/billing/success`,
    cancel_url: `${req.headers.get('origin')}/billing/cancel`,
  })

  return Response.json({ url: checkoutSession.url })
}
```

**Option 2: Supabase Edge Functions + Stripe**
```typescript
// supabase/functions/create-checkout/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.0.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  // Same logic as above
})
```

### Pricing Tiers

| Feature | Free | Pro ($9/mo) | Team ($29/mo) |
|---------|------|-------------|---------------|
| Active rooms | 1 | 10 | Unlimited |
| Participants per room | 10 | 50 | Unlimited |
| Estimation history | 7 days | 90 days | Forever |
| Custom branding | ❌ | ✅ | ✅ |
| API access | ❌ | ❌ | ✅ |
| Priority support | ❌ | ❌ | ✅ |

### Database Schema for Billing

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL, -- 'free', 'pro', 'team'
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add subscription limits check
CREATE OR REPLACE FUNCTION check_room_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_plan TEXT;
  active_rooms INT;
  max_rooms INT;
BEGIN
  -- Get user's plan
  SELECT plan INTO user_plan
  FROM subscriptions
  WHERE user_id = NEW.owner_id
  AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Default to free if no subscription
  user_plan := COALESCE(user_plan, 'free');

  -- Count active rooms
  SELECT COUNT(*) INTO active_rooms
  FROM rooms
  WHERE owner_id = NEW.owner_id
  AND active = true;

  -- Set max rooms based on plan
  max_rooms := CASE user_plan
    WHEN 'free' THEN 1
    WHEN 'pro' THEN 10
    WHEN 'team' THEN 999999
    ELSE 1
  END;

  -- Check limit
  IF active_rooms >= max_rooms THEN
    RAISE EXCEPTION 'Room limit reached for plan %', user_plan;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_room_limit
  BEFORE INSERT ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION check_room_limit();
```

---

## Migration Execution Plan

### Timeline Estimate

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Phase 1: Database** | 1 week | Schema design, migrations, RLS policies, testing |
| **Phase 2: Auth** | 3 days | Supabase Auth setup, login UI, middleware |
| **Phase 3: Realtime** | 1 week | Replace Socket.IO, test subscriptions, presence |
| **Phase 4: Frontend** | 2-3 weeks | Next.js setup, component migration, styling |
| **Phase 5: Deployment** | 3 days | Vercel setup, CI/CD, domain config |
| **Phase 6: Billing** | 1 week | Stripe integration, subscription UI, limits |
| **Testing & Polish** | 1 week | E2E tests, bug fixes, performance tuning |

**Total:** 6-7 weeks

### Step-by-Step Execution

#### Week 1: Database Foundation
- [ ] Create Supabase project
- [ ] Design and implement database schema
- [ ] Set up RLS policies
- [ ] Create database functions and triggers
- [ ] Test migrations locally with Supabase CLI
- [ ] Deploy to Supabase Cloud

#### Week 2: Authentication
- [ ] Enable Supabase Auth providers
- [ ] Create Next.js project with App Router
- [ ] Implement auth middleware
- [ ] Build login/signup pages
- [ ] Set up auth callback handlers
- [ ] Test OAuth flows

#### Week 3: Realtime Subscriptions
- [ ] Create custom hooks for Supabase Realtime
- [ ] Implement presence tracking
- [ ] Test realtime updates across multiple clients
- [ ] Migrate all Socket.IO events to Supabase
- [ ] Performance testing (latency, connection stability)

#### Weeks 4-5: Component Migration
- [ ] Set up shadcn/ui and Tailwind
- [ ] Migrate landing page (intro.vue → page.tsx)
- [ ] Migrate room page (room.vue → [slug]/page.tsx)
- [ ] Convert all Vue components to React:
  - [ ] UserCard
  - [ ] AdminControls
  - [ ] EstimationGrid
  - [ ] EstimationChart
  - [ ] UserControls
- [ ] Implement theme system with next-themes
- [ ] Responsive design testing

#### Week 6: Deployment & Polish
- [ ] Deploy to Vercel (staging)
- [ ] Configure custom domain
- [ ] Set up CI/CD pipeline
- [ ] Performance optimization (bundle size, lazy loading)
- [ ] Accessibility audit (WCAG compliance)
- [ ] Cross-browser testing

#### Week 7: Billing (Optional)
- [ ] Set up Stripe account
- [ ] Create subscription products/prices
- [ ] Implement checkout flow
- [ ] Add subscription limits to database
- [ ] Build billing dashboard
- [ ] Test webhook handlers

---

## Risk Assessment & Mitigation

### Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Realtime latency higher than Socket.IO | Medium | Low | Test early, consider Supabase Realtime optimizations |
| Supabase free tier limits | High | Medium | Monitor usage, upgrade to Pro early if needed |
| Migration takes longer than estimated | Medium | High | Start with MVP, iterate on features |
| Data model doesn't fit Supabase Realtime | High | Low | Prototype in week 3, pivot if needed |
| Auth UX friction (compared to no-auth) | Medium | Medium | Implement guest access or magic links |

### Rollback Plan

If migration fails or has critical issues:
1. Keep current NestJS backend running on separate subdomain
2. Gradual rollout: 10% of users → 50% → 100%
3. Feature flag system to toggle Supabase vs. Socket.IO
4. Data export script from Supabase back to in-memory format

---

## Success Metrics

### Technical Metrics
- ✅ Page load time < 2s
- ✅ Realtime latency < 500ms
- ✅ 99.9% uptime (Vercel + Supabase SLA)
- ✅ Lighthouse score > 90
- ✅ Zero backend maintenance (vs. current HTTPS server)

### Business Metrics
- ✅ Deploy time: < 5 minutes (vs. custom server setup)
- ✅ Easy sign-in flow (OAuth providers)
- ✅ Billing integration ready
- ✅ Cost: ~$25/month for Pro tier (Supabase + Vercel)

---

## Cost Breakdown

### Current Architecture (estimated)
- VPS for NestJS backend: $10-20/month
- SSL certificates: Free (Let's Encrypt)
- Maintenance time: ~4 hours/month

### New Architecture
**Supabase:**
- Free tier: 500MB database, 2GB bandwidth, unlimited API requests
- Pro tier ($25/mo): 8GB database, 50GB bandwidth, daily backups

**Vercel:**
- Hobby (free): Unlimited deployments, 100GB bandwidth
- Pro ($20/mo): Analytics, more bandwidth, team features

**Total:** $0-45/month (vs. $10-20/month + maintenance)

**Break-even:** Billing revenue from 5+ paid users covers costs

---

## Conclusion

This migration plan transforms Estimate-me from a custom backend requiring manual server management to a fully managed, scalable, and modern architecture. The Supabase + Next.js + Vercel stack provides:

1. **Zero backend maintenance** - No NestJS server to manage
2. **Built-in auth** - OAuth, magic links, email/password
3. **Persistent data** - Postgres with automatic backups
4. **Real-time by default** - Supabase Realtime subscriptions
5. **Easy billing** - Stripe integration via Vercel or Edge Functions
6. **Scalability** - Handles 1 to 10,000+ concurrent users
7. **Developer experience** - TypeScript end-to-end, fast deploys

The migration is feasible in 6-7 weeks with low technical risk and high business value.

---

## Next Steps

1. **Review & approve this plan** with stakeholders
2. **Create Supabase project** and test schema locally
3. **Set up Next.js boilerplate** with Supabase integration
4. **Prototype realtime subscriptions** to validate approach
5. **Begin component migration** starting with landing page
6. **Iterative deployment** (staging → production)

Let me know if you'd like me to start implementing Phase 1 (Database Schema)!
