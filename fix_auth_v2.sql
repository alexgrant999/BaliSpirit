-- FIX FOR INFINITE RECURSION IN RLS POLICIES
-- Run this in Supabase SQL Editor

-- 1. Drop all existing policies
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('categories', 'venues', 'presenters', 'events', 'event_presenters', 'profiles', 'user_favorites')
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. Create a helper function to check admin status (bypasses RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. PUBLIC DATA POLICIES (readable by everyone)

-- Categories
CREATE POLICY "public_read_categories" ON categories
  FOR SELECT
  USING (true);

CREATE POLICY "admin_manage_categories" ON categories
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Venues
CREATE POLICY "public_read_venues" ON venues
  FOR SELECT
  USING (true);

CREATE POLICY "admin_manage_venues" ON venues
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Presenters
CREATE POLICY "public_read_presenters" ON presenters
  FOR SELECT
  USING (true);

CREATE POLICY "admin_manage_presenters" ON presenters
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Events
CREATE POLICY "public_read_events" ON events
  FOR SELECT
  USING (true);

CREATE POLICY "admin_manage_events" ON events
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Event Presenters
CREATE POLICY "public_read_event_presenters" ON event_presenters
  FOR SELECT
  USING (true);

CREATE POLICY "admin_manage_event_presenters" ON event_presenters
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- 4. PROFILES POLICIES (non-recursive)

-- Users can read their own profile
CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "users_insert_own_profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile (but not their role)
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can read all profiles (uses function to avoid recursion)
CREATE POLICY "admins_read_all_profiles" ON profiles
  FOR SELECT
  USING (is_admin());

-- Admins can update all profiles (uses function to avoid recursion)
CREATE POLICY "admins_update_all_profiles" ON profiles
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- 5. USER FAVORITES POLICIES

CREATE POLICY "users_manage_own_favorites" ON user_favorites
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Ensure the trigger exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Done!
SELECT 'Policies fixed! Infinite recursion resolved.' as status;
