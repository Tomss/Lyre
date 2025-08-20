/*
  # Création de la nouvelle table morceaux

  1. Nouvelle table morceaux
    - `id` (uuid, primary key)
    - `nom` (text, nom du morceau)
    - `compositeur` (text, compositeur du morceau)
    - `arrangement` (text, arrangement spécifique)
    - `annees` (text[], années où le morceau est joué)
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  2. Table de liaison morceau_orchestras
    - `id` (uuid, primary key)
    - `morceau_id` (uuid, foreign key vers morceaux)
    - `orchestra_id` (uuid, foreign key vers orchestras)
    - `created_at` (timestamp)

  3. Sécurité
    - Enable RLS sur les deux tables
    - Politiques pour Admin et Gestionnaire
*/

-- Créer la table morceaux
CREATE TABLE IF NOT EXISTS morceaux (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  compositeur text,
  arrangement text,
  annees text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer la table de liaison morceau_orchestras
CREATE TABLE IF NOT EXISTS morceau_orchestras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  morceau_id uuid NOT NULL REFERENCES morceaux(id) ON DELETE CASCADE,
  orchestra_id uuid NOT NULL REFERENCES orchestras(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(morceau_id, orchestra_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS morceaux_created_at_idx ON morceaux(created_at DESC);
CREATE INDEX IF NOT EXISTS morceau_orchestras_morceau_idx ON morceau_orchestras(morceau_id);
CREATE INDEX IF NOT EXISTS morceau_orchestras_orchestra_idx ON morceau_orchestras(orchestra_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_morceaux_updated_at 
  BEFORE UPDATE ON morceaux 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE morceaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE morceau_orchestras ENABLE ROW LEVEL SECURITY;

-- Politiques pour morceaux
CREATE POLICY "Admin et gestionnaire peuvent tout gérer sur morceaux"
  ON morceaux
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Admin', 'Gestionnaire')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Admin', 'Gestionnaire')
    )
  );

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

-- Politiques pour morceau_orchestras
CREATE POLICY "Admin et gestionnaire peuvent tout gérer sur morceau_orchestras"
  ON morceau_orchestras
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Admin', 'Gestionnaire')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Admin', 'Gestionnaire')
    )
  );

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