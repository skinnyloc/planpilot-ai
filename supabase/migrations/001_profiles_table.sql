-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR PRIMARY KEY, -- Clerk user ID
  email VARCHAR NOT NULL,
  username VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can only access their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.jwt() ->> 'sub');

-- Create policy for service role (for admin operations)
CREATE POLICY "Service role can manage all profiles" ON profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE profiles IS 'User profile information synced from Clerk authentication';