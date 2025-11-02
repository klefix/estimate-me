# Supabase Setup Instructions

This directory contains the database schema and configuration for the Estimate-me application.

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Install Supabase CLI: `npm install -g supabase`

## Setup Steps

### 1. Link to Your Supabase Project

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

You can find your project ref in the Supabase dashboard URL: `https://app.supabase.com/project/YOUR_PROJECT_REF`

### 2. Run Migrations

```bash
supabase db push
```

This will apply all migrations in the `migrations/` directory to your Supabase project.

### 3. Configure Authentication

In your Supabase dashboard:

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider
3. (Optional) Enable **OAuth providers** (Google, GitHub, etc.)
4. Configure **Email Templates** for verification and password reset
5. Add your site URL to **Redirect URLs**: `http://localhost:3000/auth/callback` (development) and `https://yourdomain.com/auth/callback` (production)

### 4. Get Your API Keys

1. Go to **Settings** > **API**
2. Copy your **Project URL** and **anon/public** key
3. Add them to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Generate TypeScript Types (Optional)

Update the database types file after schema changes:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts
```

## Database Schema

The schema includes:

- **profiles**: User profiles (auto-created on signup)
- **rooms**: Planning poker rooms
- **room_participants**: Users in each room with admin status
- **estimations**: User votes/estimations
- **room_state** (view): Denormalized view for easy querying

## Features

- ✅ Row Level Security (RLS) policies on all tables
- ✅ Auto-promotion of first user to admin
- ✅ Auto-reveal when all users estimate
- ✅ Automatic timestamp updates
- ✅ Cleanup function for inactive rooms

## Testing Locally

You can test the schema locally with Supabase CLI:

```bash
# Start local Supabase (requires Docker)
supabase start

# Apply migrations
supabase db reset

# Generate types
supabase gen types typescript --local > lib/supabase/database.types.ts

# Stop local Supabase
supabase stop
```

## Troubleshooting

### Migration fails

If a migration fails, you can reset the database:

```bash
supabase db reset
```

**Warning**: This will delete all data!

### RLS policies blocking queries

Check that your queries are authenticated:
- Client components: Use `createClientComponentClient()`
- Server components: Use `createServerComponentClient({ cookies })`
- Middleware: Use `createMiddlewareClient({ req, res })`

### Realtime not working

1. Check that Realtime is enabled for your tables in **Database** > **Replication**
2. Ensure your client is subscribed to the correct channel
3. Check browser console for connection errors
