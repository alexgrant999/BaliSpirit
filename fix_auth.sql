-- FIX FOR AUTHENTICATION AND DATA LOADING ISSUES
-- Run this in Supabase SQL Editor

-- 1. Drop all existing policies on all tables
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

-- 2. Create simple, permissive read policies for public data
-- These tables should be readable by EVERYONE (authenticated or not)

-- Categories
CREATE POLICY "public_read_categories" ON categories
  FOR SELECT
  USING (true);

CREATE POLICY "admin_write_categories" ON categories
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Venues
CREATE POLICY "public_read_venues" ON venues
  FOR SELECT
  USING (true);

CREATE POLICY "admin_write_venues" ON venues
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Presenters
CREATE POLICY "public_read_presenters" ON presenters
  FOR SELECT
  USING (true);

CREATE POLICY "admin_write_presenters" ON presenters
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Events
CREATE POLICY "public_read_events" ON events
  FOR SELECT
  USING (true);

CREATE POLICY "admin_write_events" ON events
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Event Presenters
CREATE POLICY "public_read_event_presenters" ON event_presenters
  FOR SELECT
  USING (true);

CREATE POLICY "admin_write_event_presenters" ON event_presenters
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. Profiles - users can manage their own, admins can manage all
CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_insert_own_profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "admins_all_profiles" ON profiles
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. User Favorites - users can only manage their own
CREATE POLICY "users_manage_own_favorites" ON user_favorites
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Verify the trigger exists
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
SELECT 'All policies have been reset. Try logging in again.' as status;
