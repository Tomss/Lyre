/*
  # Create morceaux and morceau_orchestras tables

  1. New Tables
    - `morceaux`
      - `id` (uuid, primary key)
      - `nom` (text, required) - Title of the musical piece
      - `compositeur` (text, optional) - Composer name
      - `arrangement` (text, optional) - Arrangement details
      - `created_at` (timestamp) - Creation date
      - `updated_at` (timestamp) - Last update date
    
    - `morceau_orchestras`
      - `id` (uuid, primary key)
      - `morceau_id` (uuid, foreign key to morceaux)
      - `orchestra_id` (uuid, foreign key to orchestras)
      - `created_at` (timestamp) - Creation date

  2. Security
    - Enable RLS on both tables
    - Admin and Gestionnaire can manage all morceaux
    - Users can read morceaux from their orchestras
    - Admin and Gestionnaire can manage morceau_orchestras
    - Users can read morceau_orchestras for their orchestras

  3. Indexes
    - Index on morceau_id for morceau_orchestras
    - Index on orchestra_id for morceau_orchestras
    - Unique constraint on morceau_id + orchestra_id combination
*/

-- Create morceaux table
CREATE TABLE IF NOT EXISTS morceaux (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  compositeur text,
  arrangement text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create morceau_orchestras junction table
CREATE TABLE IF NOT EXISTS morceau_orchestras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  morceau_id uuid NOT NULL REFERENCES morceaux(id) ON DELETE CASCADE,
  orchestra_id uuid NOT NULL REFERENCES orchestras(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(morceau_id, orchestra_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS morceau_orchestras_morceau_idx ON morceau_orchestras(morceau_id);
CREATE INDEX IF NOT EXISTS morceau_orchestras_orchestra_idx ON morceau_orchestras(orchestra_id);
CREATE INDEX IF NOT EXISTS morceaux_created_at_idx ON morceaux(created_at DESC);

-- Enable RLS
ALTER TABLE morceaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE morceau_orchestras ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger for morceaux
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_morceaux_updated_at'
  ) THEN
    CREATE TRIGGER update_morceaux_updated_at
      BEFORE UPDATE ON morceaux
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- RLS Policies for morceaux
CREATE POLICY "Admin et gestionnaire peuvent tout gérer sur morceaux"
  ON morceaux
  FOR ALL
  TO authenticated
  USING (get_my_role() = ANY(ARRAY['Admin', 'Gestionnaire']))
  WITH CHECK (get_my_role() = ANY(ARRAY['Admin', 'Gestionnaire']));

CREATE POLICY "Utilisateurs peuvent lire les morceaux de leurs orchestres"
  ON morceaux
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM morceau_orchestras mo
      JOIN user_orchestras uo ON mo.orchestra_id = uo.orchestra_id
      WHERE mo.morceau_id = morceaux.id 
      AND uo.user_id = auth.uid()
    )
  );

-- RLS Policies for morceau_orchestras
CREATE POLICY "Admin et gestionnaire peuvent tout gérer sur morceau_orchestras"
  ON morceau_orchestras
  FOR ALL
  TO authenticated
  USING (get_my_role() = ANY(ARRAY['Admin', 'Gestionnaire']))
  WITH CHECK (get_my_role() = ANY(ARRAY['Admin', 'Gestionnaire']));

CREATE POLICY "Utilisateurs peuvent lire les associations de leurs orchestres"
  ON morceau_orchestras
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_orchestras uo
      WHERE uo.orchestra_id = morceau_orchestras.orchestra_id
      AND uo.user_id = auth.uid()
    )
  );