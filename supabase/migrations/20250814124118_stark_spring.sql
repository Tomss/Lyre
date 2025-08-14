/*
  # Create instruments system

  1. New Tables
    - `instruments`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
    - `user_instruments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `instrument_id` (uuid, foreign key to instruments)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read instruments
    - Add policies for users to manage their own instrument associations
    - Add policies for admins to manage all associations

  3. Data
    - Insert the 10 predefined instruments
*/

-- Create instruments table
CREATE TABLE IF NOT EXISTS instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_instruments junction table
CREATE TABLE IF NOT EXISTS user_instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instrument_id uuid NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, instrument_id)
);

-- Enable RLS
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_instruments ENABLE ROW LEVEL SECURITY;

-- Policies for instruments table
CREATE POLICY "Anyone can read instruments"
  ON instruments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage instruments"
  ON instruments
  FOR ALL
  TO authenticated
  USING (get_my_role() = 'Admin'::text)
  WITH CHECK (get_my_role() = 'Admin'::text);

-- Policies for user_instruments table
CREATE POLICY "Users can read own instruments"
  ON user_instruments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own instruments"
  ON user_instruments
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all user instruments"
  ON user_instruments
  FOR ALL
  TO authenticated
  USING (get_my_role() = 'Admin'::text)
  WITH CHECK (get_my_role() = 'Admin'::text);

-- Insert predefined instruments
INSERT INTO instruments (name) VALUES
  ('Flute'),
  ('Hautbois'),
  ('Clarinette'),
  ('Saxophone'),
  ('Cor'),
  ('Trompette'),
  ('Trombone'),
  ('Tuba'),
  ('Percussions'),
  ('Contrebasse à cordes')
ON CONFLICT (name) DO NOTHING;