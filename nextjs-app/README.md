# Estimate Me - Next.js + Supabase

Modern planning poker application built with Next.js 14, Supabase, and Tailwind CSS.

## Features

- 🔄 **Real-time collaboration** using Supabase Realtime
- 🔐 **Authentication** with email/password and OAuth (Google, GitHub)
- 🎨 **Multiple themes** (Cpt. Obvious, NeuMorpheus, C64)
- 📊 **Live estimation results** with charts
- 👥 **Presence tracking** to see who's online
- 🎭 **Custom avatars** with emoji picker
- 📱 **Responsive design** works on desktop and mobile

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Supabase (PostgreSQL + Realtime + Auth)
- **Styling**: Tailwind CSS, shadcn/ui components
- **Charts**: Recharts
- **Deployment**: Vercel (frontend), Supabase Cloud (backend)

## Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (https://supabase.com)
- (Optional) Vercel account for deployment

## Getting Started

### 1. Clone and Install

```bash
cd nextjs-app
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Run the SQL migrations:

```bash
cd supabase
# Copy and paste the contents of migrations/20250102000000_initial_schema.sql
# into your Supabase SQL editor and execute
```

Or use the Supabase CLI:

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

3. Enable authentication providers in Supabase dashboard:
   - Go to **Authentication** > **Providers**
   - Enable Email and any OAuth providers (Google, GitHub)
   - Add redirect URLs: `http://localhost:3000/auth/callback`

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from **Settings** > **API** in your Supabase dashboard.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
nextjs-app/
├── app/                    # Next.js App Router
│   ├── auth/
│   │   └── callback/      # OAuth callback handler
│   ├── login/             # Login/signup page
│   ├── rooms/             # Room pages
│   │   └── [slug]/        # Individual room view
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Reusable UI components (Button, Input, Card)
│   ├── room/              # Room-specific components
│   └── layout/            # Layout components (ThemeProvider)
├── hooks/
│   ├── useRoomRealtime.ts # Real-time room state hook
│   ├── usePresence.ts     # Presence tracking hook
│   └── useRoomActions.ts  # Room mutations hook
├── lib/
│   ├── supabase/          # Supabase client utilities
│   ├── types.ts           # TypeScript type definitions
│   └── utils.ts           # Utility functions
├── supabase/
│   ├── migrations/        # Database schema migrations
│   └── README.md          # Supabase setup instructions
└── public/                # Static assets
```

## Key Concepts

### Authentication

The app uses Supabase Auth with Row Level Security (RLS) policies. Users must be authenticated to:
- Join rooms
- Submit estimations
- View other participants

### Real-time Updates

Real-time synchronization is handled by Supabase Realtime subscriptions:
- Changes to `room_participants` → refresh participant list
- Changes to `estimations` → update votes
- Changes to `rooms` → update room settings

See `hooks/useRoomRealtime.ts` for implementation.

### Presence Tracking

Online/offline status is tracked using Supabase Realtime Presence:
- Users are tracked when they join a room
- `last_seen_at` is updated every 30 seconds
- Presence is removed when users leave

See `hooks/usePresence.ts` for implementation.

### Room Permissions

- **Admin**: First user to join a room becomes admin
- **Admin powers**: Set estimation values, clear votes, reveal results, grant admin to others
- **All users**: Submit estimations, change name/avatar, leave room

## Development

### Type Safety

Generate TypeScript types from your Supabase schema:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run type-check
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Update Supabase Auth URLs

After deployment, update redirect URLs in Supabase:
- Go to **Authentication** > **URL Configuration**
- Add production URL: `https://yourdomain.com/auth/callback`

## Troubleshooting

### "No session" errors

Make sure you're using the correct Supabase client for the context:
- Client Components: `createClientComponentClient()`
- Server Components: `createServerComponentClient({ cookies })`
- Middleware: `createMiddlewareClient({ req, res })`

### Realtime not working

1. Check that Realtime is enabled for your tables in **Database** > **Replication**
2. Verify RLS policies allow reading from tables
3. Check browser console for connection errors

### Build errors

Common issues:
- Missing environment variables → Check `.env.local`
- Type errors → Run `npm run type-check`
- Supabase schema mismatch → Regenerate types

## Features Comparison

| Feature | Old (NestJS + Vue) | New (Supabase + Next.js) |
|---------|-------------------|--------------------------|
| Data persistence | In-memory only | PostgreSQL database |
| Authentication | None | Email + OAuth |
| Real-time | Socket.IO custom | Supabase Realtime |
| Deployment | Custom server | Vercel (serverless) |
| Scaling | Manual | Automatic |
| Maintenance | High | Low |

## Future Enhancements

- [ ] Billing integration with Stripe
- [ ] Room history and analytics
- [ ] Custom estimation scales
- [ ] Export results to CSV/PDF
- [ ] Team management
- [ ] API access

## Migration from Old Version

See `MIGRATION_PLAN.md` in the root directory for the full migration strategy.

## License

MIT

## Contributing

PRs welcome! Please follow the existing code style and add tests for new features.

## Support

For issues and questions:
- GitHub Issues: https://github.com/klefix/estimate-me/issues
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
