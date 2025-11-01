/*
  # HakiChain Core Database Schema
  
  1. New Tables
    - `profiles` - User profiles for lawyers, NGOs, and donors
    - `bounties` - Legal cases posted by NGOs
    - `milestones` - Payment milestones for each bounty
    - `applications` - Lawyer applications to bounties
    - `donations` - Funding contributions from donors
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on user_type
*/

-- Create user_type enum
DO $$ BEGIN
  CREATE TYPE user_type AS ENUM ('lawyer', 'ngo', 'donor');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create bounty_status enum
DO $$ BEGIN
  CREATE TYPE bounty_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create milestone_status enum
DO $$ BEGIN
  CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'completed', 'verified');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create application_status enum
DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  user_type user_type NOT NULL,
  organization_name text,
  practicing_certificate text,
  wallet_address text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Bounties table
CREATE TABLE IF NOT EXISTS bounties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id uuid REFERENCES profiles(id) NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  jurisdiction text NOT NULL,
  category text NOT NULL,
  funding_goal integer NOT NULL DEFAULT 0,
  current_funding integer NOT NULL DEFAULT 0,
  status bounty_status DEFAULT 'open',
  deadline timestamptz,
  created_at timestamptz DEFAULT now(),
  tags text[] DEFAULT '{}'
);

ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bounties"
  ON bounties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "NGOs can create bounties"
  ON bounties FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'ngo'
    )
  );

CREATE POLICY "NGOs can update own bounties"
  ON bounties FOR UPDATE
  TO authenticated
  USING (ngo_id = auth.uid())
  WITH CHECK (ngo_id = auth.uid());

-- Applications table (created before milestones)
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id uuid REFERENCES bounties(id) ON DELETE CASCADE NOT NULL,
  lawyer_id uuid REFERENCES profiles(id) NOT NULL,
  proposal text NOT NULL,
  status application_status DEFAULT 'pending',
  applied_at timestamptz DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers can view own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (lawyer_id = auth.uid());

CREATE POLICY "NGOs can view applications for own bounties"
  ON applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bounties
      WHERE bounties.id = applications.bounty_id
      AND bounties.ngo_id = auth.uid()
    )
  );

CREATE POLICY "Lawyers can create applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (
    lawyer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'lawyer'
    )
  );

CREATE POLICY "NGOs can update application status"
  ON applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bounties
      WHERE bounties.id = applications.bounty_id
      AND bounties.ngo_id = auth.uid()
    )
  );

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id uuid REFERENCES bounties(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  order_index integer NOT NULL,
  status milestone_status DEFAULT 'pending',
  due_date timestamptz,
  evidence_required text,
  submitted_evidence text,
  submitted_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view milestones"
  ON milestones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "NGOs can create milestones for own bounties"
  ON milestones FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bounties
      WHERE bounties.id = milestones.bounty_id
      AND bounties.ngo_id = auth.uid()
    )
  );

CREATE POLICY "Lawyers can update milestone evidence"
  ON milestones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.bounty_id = milestones.bounty_id
      AND applications.lawyer_id = auth.uid()
      AND applications.status = 'accepted'
    )
  );

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id uuid REFERENCES bounties(id) ON DELETE CASCADE NOT NULL,
  donor_id uuid REFERENCES profiles(id),
  amount integer NOT NULL,
  is_anonymous boolean DEFAULT false,
  payment_method text NOT NULL,
  transaction_hash text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can view own donations"
  ON donations FOR SELECT
  TO authenticated
  USING (donor_id = auth.uid());

CREATE POLICY "NGOs can view donations for own bounties"
  ON donations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bounties
      WHERE bounties.id = donations.bounty_id
      AND bounties.ngo_id = auth.uid()
    )
  );

CREATE POLICY "Donors can create donations"
  ON donations FOR INSERT
  TO authenticated
  WITH CHECK (donor_id = auth.uid() OR is_anonymous = true);
