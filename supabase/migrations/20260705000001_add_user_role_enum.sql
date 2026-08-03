-- ==========================================
-- Add user_role enum and update profiles table
-- to distinguish between developer (superadmin)
-- and internal HR team users
-- ==========================================

-- 1. Create the user_role enum
CREATE TYPE easycorp.user_role AS ENUM ('superadmin', 'hr');

-- 2. Drop the old profiles table (safe to recreate, RLS only)
DROP TABLE IF EXISTS easycorp.profiles CASCADE;

-- 3. Create the new profiles table with enum role
CREATE TABLE IF NOT EXISTS easycorp.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role easycorp.user_role DEFAULT 'hr'::easycorp.user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Turn on RLS
ALTER TABLE easycorp.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Allow reading own profile
CREATE POLICY "Allow users to read own profile" ON easycorp.profiles
  FOR SELECT USING (auth.uid() = id);

-- 6. Create a trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION easycorp.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO easycorp.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'hr'::easycorp.user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION easycorp.handle_new_user();

-- 8. Backfill existing users (give them superadmin by default so they don't get locked out)
INSERT INTO easycorp.profiles (id, email, role)
SELECT id, email, 'superadmin'::easycorp.user_role
FROM auth.users
ON CONFLICT (id) DO NOTHING;
