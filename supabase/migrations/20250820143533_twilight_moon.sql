/*
  # Création du système de morceaux

  1. Nouvelles Tables
    - `morceaux`
      - `id` (uuid, primary key)
      - `nom` (text, nom du morceau)
      - `compositeur` (text, optionnel)
      - `arrangement` (text, optionnel)
      - `annees` (text[], années où le morceau est joué)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `morceau_orchestras` (table de liaison)
      - `id` (uuid, primary key)
      - `morceau_id` (uuid, référence vers morceaux)
      - `orchestra_id` (uuid, référence vers orchestras)
      - `created_at` (timestamp)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques Admin/Gestionnaire pour la gestion
    - Politique de lecture pour tous les utilisateurs authentifiés

  3. Fonctions
    - Trigger pour updated_at automatique
*/

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Table morceaux
CREATE TABLE IF NOT EXISTS morceaux (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  compositeur text,
  arrangement text,
  annees text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table de liaison morceau_orchestras
CREATE TABLE IF NOT EXISTS morceau_orchestras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  morceau_id uuid NOT NULL REFERENCES morceaux(id) ON DELETE CASCADE,
  orchestra_id uuid NOT NULL REFERENCES orchestras(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(morceau_id, orchestra_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS morceaux_nom_idx ON morceaux(nom);
CREATE INDEX IF NOT EXISTS morceau_orchestras_morceau_idx ON morceau_orchestras(morceau_id);
CREATE INDEX IF NOT EXISTS morceau_orchestras_orchestra_idx ON morceau_orchestras(orchestra_id);

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_morceaux_updated_at ON morceaux;
CREATE TRIGGER update_morceaux_updated_at
  BEFORE UPDATE ON morceaux
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE morceaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE morceau_orchestras ENABLE ROW LEVEL SECURITY;

-- Politiques pour morceaux
DROP POLICY IF EXISTS "Admin et gestionnaire peuvent gérer les morceaux" ON morceaux;
CREATE POLICY "Admin et gestionnaire peuvent gérer les morceaux"
  ON morceaux
  FOR ALL
  TO authenticated
  USING (get_my_role() = ANY (ARRAY['Admin'::text, 'Gestionnaire'::text]))
  WITH CHECK (get_my_role() = ANY (ARRAY['Admin'::text, 'Gestionnaire'::text]));

DROP POLICY IF EXISTS "Tous peuvent lire les morceaux" ON morceaux;
CREATE POLICY "Tous peuvent lire les morceaux"
  ON morceaux
  FOR SELECT
  TO authenticated
  USING (true);

-- Politiques pour morceau_orchestras
DROP POLICY IF EXISTS "Admin et gestionnaire peuvent gérer les associations" ON morceau_orchestras;
CREATE POLICY "Admin et gestionnaire peuvent gérer les associations"
  ON morceau_orchestras
  FOR ALL
  TO authenticated
  USING (get_my_role() = ANY (ARRAY['Admin'::text, 'Gestionnaire'::text]))
  WITH CHECK (get_my_role() = ANY (ARRAY['Admin'::text, 'Gestionnaire'::text]));

DROP POLICY IF EXISTS "Tous peuvent lire les associations" ON morceau_orchestras;
CREATE POLICY "Tous peuvent lire les associations"
  ON morceau_orchestras
  FOR SELECT
  TO authenticated
  USING (true);