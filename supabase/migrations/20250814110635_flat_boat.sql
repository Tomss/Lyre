/*
  # Fix RLS policies for user management

  1. Security Updates
    - Add policy for admins to insert profiles for new users
    - Add policy for admins to read all profiles
    - Fix existing policies to work with admin user creation
  
  2. Changes
    - Allow admins to create profiles for any user
    - Allow admins to read all user profiles
    - Keep existing policies for individual access
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Allow admin full access" ON profiles;
DROP POLICY IF EXISTS "Allow individual read access" ON profiles;
DROP POLICY IF EXISTS "Allow individual update access" ON profiles;

-- Allow admins to have full access to all profiles
CREATE POLICY "Admin full access" ON profiles
  FOR ALL
  TO authenticated
  USING (get_my_role() = 'Admin')
  WITH CHECK (get_my_role() = 'Admin');

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert their own profile (for signup)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);