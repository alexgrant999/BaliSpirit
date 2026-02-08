
-- BALI SPIRIT FESTIVAL - MASTER RESET SCRIPT
-- RUN THIS IN THE SUPABASE SQL EDITOR

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS presenters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  image TEXT,
  website TEXT,
  instagram TEXT,
  facebook TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_presenters (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  presenter_id UUID REFERENCES presenters(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, presenter_id)
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  interests TEXT[] DEFAULT '{}',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_favorites (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

-- 3. SECURITY (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE presenters ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_presenters ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES
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

    -- Categories: public read, admin write
    CREATE POLICY "Anyone can read categories" ON categories FOR SELECT USING (true);
    CREATE POLICY "Admins can modify categories" ON categories FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
    CREATE POLICY "Admins can update categories" ON categories FOR UPDATE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
    CREATE POLICY "Admins can delete categories" ON categories FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

    -- Venues: public read, admin write
    CREATE POLICY "Anyone can read venues" ON venues FOR SELECT USING (true);
    CREATE POLICY "Admins can modify venues" ON venues FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
    CREATE POLICY "Admins can update venues" ON venues FOR UPDATE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
    CREATE POLICY "Admins can delete venues" ON venues FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

    -- Presenters: public read, admin write
    CREATE POLICY "Anyone can read presenters" ON presenters FOR SELECT USING (true);
    CREATE POLICY "Admins can modify presenters" ON presenters FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
    CREATE POLICY "Admins can update presenters" ON presenters FOR UPDATE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
    CREATE POLICY "Admins can delete presenters" ON presenters FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

    -- Events: public read, admin write
    CREATE POLICY "Anyone can read events" ON events FOR SELECT USING (true);
    CREATE POLICY "Admins can modify events" ON events FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
    CREATE POLICY "Admins can update events" ON events FOR UPDATE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
    CREATE POLICY "Admins can delete events" ON events FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

    -- Event Presenters: public read, admin write
    CREATE POLICY "Anyone can read event_presenters" ON event_presenters FOR SELECT USING (true);
    CREATE POLICY "Admins can modify event_presenters" ON event_presenters FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
    CREATE POLICY "Admins can update event_presenters" ON event_presenters FOR UPDATE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
    CREATE POLICY "Admins can delete event_presenters" ON event_presenters FOR DELETE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

    -- Profiles: users can view/update own, insert own as fallback
    CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
    CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
    CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    CREATE POLICY "Admin view all profiles" ON profiles FOR SELECT USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
    CREATE POLICY "Admin update all profiles" ON profiles FOR UPDATE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

    CREATE POLICY "Users manage favorites" ON user_favorites FOR ALL USING (auth.uid() = user_id);
END $$;

-- 5. TRIGGERS
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
