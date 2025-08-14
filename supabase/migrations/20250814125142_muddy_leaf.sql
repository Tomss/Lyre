/*
  # Create orchestras system

  1. New Tables
    - `orchestras`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text, optional)
      - `created_at` (timestamp)
    - `user_orchestras`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `orchestra_id` (uuid, foreign key to orchestras)
      - `created_at` (timestamp)
      - Unique constraint on (user_id, orchestra_id)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read orchestras
    - Add policies for users to manage their own orchestra associations
    - Add policies for admins to manage everything

  3. Data
    - Insert the 5 predefined orchestras
*/

-- Create orchestras table
CREATE TABLE IF NOT EXISTS orchestras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create user_orchestras junction table
CREATE TABLE IF NOT EXISTS user_orchestras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  orchestra_id uuid NOT NULL REFERENCES orchestras(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, orchestra_id)
);

-- Enable RLS
ALTER TABLE orchestras ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_orchestras ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orchestras
CREATE POLICY "Anyone can read orchestras"
  ON orchestras
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage orchestras"
  ON orchestras
  FOR ALL
  TO authenticated
  USING (get_my_role() = 'Admin')
  WITH CHECK (get_my_role() = 'Admin');

-- RLS Policies for user_orchestras
CREATE POLICY "Users can read own orchestras"
  ON user_orchestras
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own orchestras"
  ON user_orchestras
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all user orchestras"
  ON user_orchestras
  FOR ALL
  TO authenticated
  USING (get_my_role() = 'Admin')
  WITH CHECK (get_my_role() = 'Admin');

-- Insert predefined orchestras
INSERT INTO orchestras (name, description) VALUES
  ('Orchestre d''harmonie', 'L''orchestre principal de l''école, regroupant tous les instruments à vent et percussions'),
  ('Orchestre Sortilèges', 'Ensemble spécialisé dans les musiques de films et bandes originales'),
  ('Orchestre Grimoire', 'Formation dédiée aux musiques classiques et contemporaines'),
  ('Orchestre Métamorphose', 'Groupe explorant les musiques du monde et les fusions musicales'),
  ('Ensemble New Retro', 'Formation moderne alliant instruments traditionnels et sonorités actuelles')
ON CONFLICT (name) DO NOTHING;