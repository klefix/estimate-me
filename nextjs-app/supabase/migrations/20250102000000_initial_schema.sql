-- Initial schema for Estimate-me Planning Poker application
-- Run this after creating a new Supabase project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT NOT NULL DEFAULT 'Anonymous',
  avatar_emoji TEXT DEFAULT '🧑‍💻',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Anonymous')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ROOMS TABLE
-- ============================================================================
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  estimation_values TEXT[] DEFAULT ARRAY['1','2','3','5','8','13','21','?'],
  estimations_visible BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_rooms_slug ON rooms(slug);
CREATE INDEX idx_rooms_active ON rooms(active);
CREATE INDEX idx_rooms_owner ON rooms(owner_id);

-- RLS Policies for rooms
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

CREATE POLICY "Room owners can delete their rooms"
  ON rooms FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- ROOM_PARTICIPANTS TABLE
-- ============================================================================
CREATE TABLE room_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(room_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_participants_room ON room_participants(room_id);
CREATE INDEX idx_participants_user ON room_participants(user_id);
CREATE INDEX idx_participants_last_seen ON room_participants(last_seen_at);

-- RLS Policies for room_participants
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

CREATE POLICY "Users can leave rooms"
  ON room_participants FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ESTIMATIONS TABLE
-- ============================================================================
CREATE TABLE estimations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  value TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(room_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_estimations_room ON estimations(room_id);
CREATE INDEX idx_estimations_user ON estimations(user_id);

-- RLS Policies for estimations
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

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Auto-promote first user to admin when joining a room
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

-- Auto-reveal estimations when all participants have voted
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
    SET estimations_visible = true,
        updated_at = NOW()
    WHERE id = NEW.room_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_reveal
  AFTER INSERT OR UPDATE ON estimations
  FOR EACH ROW
  EXECUTE FUNCTION check_auto_reveal();

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Clean up inactive rooms (run via cron or manually)
CREATE OR REPLACE FUNCTION cleanup_inactive_rooms()
RETURNS void AS $$
BEGIN
  -- Mark rooms as inactive if no one has been active in 24 hours
  UPDATE rooms
  SET active = false,
      updated_at = NOW()
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

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Denormalized room state view for easy querying
CREATE OR REPLACE VIEW room_state AS
SELECT
  r.id AS room_id,
  r.name AS room_name,
  r.slug AS room_slug,
  r.estimation_values,
  r.estimations_visible,
  COALESCE(
    json_agg(
      json_build_object(
        'id', rp.id,
        'user_id', rp.user_id,
        'display_name', p.display_name,
        'avatar_emoji', p.avatar_emoji,
        'is_admin', rp.is_admin,
        'estimation', CASE
          WHEN r.estimations_visible THEN e.value
          WHEN e.value IS NOT NULL THEN '✓'
          ELSE NULL
        END,
        'last_seen_at', rp.last_seen_at
      )
      ORDER BY rp.joined_at
    ) FILTER (WHERE rp.user_id IS NOT NULL),
    '[]'::json
  ) AS participants
FROM rooms r
LEFT JOIN room_participants rp ON r.id = rp.room_id
LEFT JOIN profiles p ON rp.user_id = p.id
LEFT JOIN estimations e ON r.id = e.room_id AND rp.user_id = e.user_id
WHERE r.active = true
GROUP BY r.id, r.name, r.slug, r.estimation_values, r.estimations_visible;

-- Grant access to the view
GRANT SELECT ON room_state TO authenticated;

-- ============================================================================
-- INDEXES FOR REALTIME PERFORMANCE
-- ============================================================================

-- These indexes help with Supabase Realtime subscriptions
CREATE INDEX idx_room_participants_room_updated ON room_participants(room_id, last_seen_at DESC);
CREATE INDEX idx_estimations_room_updated ON estimations(room_id, submitted_at DESC);

-- ============================================================================
-- INITIAL DATA (Optional)
-- ============================================================================

-- Uncomment to create a default demo room
-- INSERT INTO rooms (name, slug, estimation_values, active)
-- VALUES (
--   'Demo Room',
--   'demo-room',
--   ARRAY['0','1','2','3','5','8','13','21','34','55','89','?'],
--   true
-- );

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles extended from auth.users';
COMMENT ON TABLE rooms IS 'Planning poker estimation rooms';
COMMENT ON TABLE room_participants IS 'Users currently in rooms with their role status';
COMMENT ON TABLE estimations IS 'Individual user estimations for planning poker';
COMMENT ON VIEW room_state IS 'Denormalized view of room state with all participants and their estimations';

COMMENT ON FUNCTION auto_promote_first_admin() IS 'Automatically makes the first user to join a room the admin';
COMMENT ON FUNCTION check_auto_reveal() IS 'Automatically reveals estimations when all participants have voted';
COMMENT ON FUNCTION cleanup_inactive_rooms() IS 'Marks rooms as inactive after 24 hours of inactivity';
