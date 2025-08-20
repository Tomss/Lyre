/*
  # Refactorisation du système de partitions avec table morceaux

  1. Nouvelles Tables
    - `morceaux`
      - `id` (uuid, primary key)
      - `nom` (text, nom du morceau)
      - `compositeur` (text, compositeur original)
      - `arrangement` (text, version/arrangement)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `morceau_orchestras` (table de liaison)
      - `id` (uuid, primary key)
      - `morceau_id` (uuid, foreign key vers morceaux)
      - `orchestra_id` (uuid, foreign key vers orchestras)
      - `created_at` (timestamp)

  2. Modifications Tables Existantes
    - `partitions` : Ajout de `morceau_id` et suppression des champs redondants

  3. Sécurité
    - Enable RLS sur toutes les nouvelles tables
    - Politiques pour Admin/Gestionnaire et lecture utilisateurs
    - Fonction pour récupérer les partitions utilisateur par morceau

  4. Fonctions
    - `get_user_partitions_by_morceaux()` : Récupère les partitions groupées par morceau
*/

-- Créer la table morceaux
CREATE TABLE IF NOT EXISTS morceaux (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  compositeur text,
  arrangement text,
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

-- Ajouter la colonne morceau_id à la table partitions existante
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partitions' AND column_name = 'morceau_id'
  ) THEN
    ALTER TABLE partitions ADD COLUMN morceau_id uuid REFERENCES morceaux(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Supprimer les anciennes colonnes redondantes de partitions si elles existent
DO $$
BEGIN
  -- Supprimer title car maintenant dans morceaux
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partitions' AND column_name = 'title'
  ) THEN
    ALTER TABLE partitions DROP COLUMN title;
  END IF;
  
  -- Supprimer orchestra_id car maintenant dans morceau_orchestras
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partitions' AND column_name = 'orchestra_id'
  ) THEN
    ALTER TABLE partitions DROP COLUMN orchestra_id;
  END IF;
END $$;

-- Activer RLS sur les nouvelles tables
ALTER TABLE morceaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE morceau_orchestras ENABLE ROW LEVEL SECURITY;

-- Politiques pour morceaux
CREATE POLICY "Admin et gestionnaire peuvent gérer les morceaux"
  ON morceaux
  FOR ALL
  TO authenticated
  USING (get_my_role() = ANY (ARRAY['Admin'::text, 'Gestionnaire'::text]))
  WITH CHECK (get_my_role() = ANY (ARRAY['Admin'::text, 'Gestionnaire'::text]));

CREATE POLICY "Tous peuvent lire les morceaux"
  ON morceaux
  FOR SELECT
  TO authenticated
  USING (true);

-- Politiques pour morceau_orchestras
CREATE POLICY "Admin et gestionnaire peuvent gérer les liaisons morceau-orchestre"
  ON morceau_orchestras
  FOR ALL
  TO authenticated
  USING (get_my_role() = ANY (ARRAY['Admin'::text, 'Gestionnaire'::text]))
  WITH CHECK (get_my_role() = ANY (ARRAY['Admin'::text, 'Gestionnaire'::text]));

CREATE POLICY "Tous peuvent lire les liaisons morceau-orchestre"
  ON morceau_orchestras
  FOR SELECT
  TO authenticated
  USING (true);

-- Mettre à jour la politique des partitions pour utiliser la nouvelle structure
DROP POLICY IF EXISTS "Utilisateurs peuvent lire leurs partitions" ON partitions;

CREATE POLICY "Utilisateurs peuvent lire leurs partitions par morceau"
  ON partitions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_instruments ui
      JOIN user_orchestras uo ON (uo.user_id = ui.user_id)
      JOIN morceau_orchestras mo ON (mo.orchestra_id = uo.orchestra_id)
      WHERE ui.user_id = auth.uid()
        AND ui.instrument_id = partitions.instrument_id
        AND mo.morceau_id = partitions.morceau_id
    )
  );

-- Créer une fonction pour récupérer les partitions utilisateur groupées par morceau
CREATE OR REPLACE FUNCTION get_user_partitions_by_morceaux(user_id uuid)
RETURNS TABLE (
  morceau_id uuid,
  morceau_nom text,
  morceau_compositeur text,
  morceau_arrangement text,
  morceau_created_at timestamptz,
  partition_id uuid,
  partition_voice text,
  partition_file_name text,
  partition_file_path text,
  partition_file_type text,
  partition_file_size bigint,
  partition_mime_type text,
  partition_created_at timestamptz,
  instrument_id uuid,
  instrument_name text,
  orchestra_ids uuid[],
  orchestra_names text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    m.id as morceau_id,
    m.nom as morceau_nom,
    m.compositeur as morceau_compositeur,
    m.arrangement as morceau_arrangement,
    m.created_at as morceau_created_at,
    p.id as partition_id,
    p.voice as partition_voice,
    p.file_name as partition_file_name,
    p.file_path as partition_file_path,
    p.file_type as partition_file_type,
    p.file_size as partition_file_size,
    p.mime_type as partition_mime_type,
    p.created_at as partition_created_at,
    i.id as instrument_id,
    i.name as instrument_name,
    ARRAY_AGG(DISTINCT o.id) as orchestra_ids,
    ARRAY_AGG(DISTINCT o.name) as orchestra_names
  FROM morceaux m
  JOIN morceau_orchestras mo ON mo.morceau_id = m.id
  JOIN orchestras o ON o.id = mo.orchestra_id
  JOIN partitions p ON p.morceau_id = m.id
  JOIN instruments i ON i.id = p.instrument_id
  JOIN user_instruments ui ON ui.instrument_id = i.id AND ui.user_id = user_id
  JOIN user_orchestras uo ON uo.orchestra_id = o.id AND uo.user_id = user_id
  GROUP BY m.id, m.nom, m.compositeur, m.arrangement, m.created_at, 
           p.id, p.voice, p.file_name, p.file_path, p.file_type, p.file_size, p.mime_type, p.created_at,
           i.id, i.name
  ORDER BY m.created_at DESC, p.created_at DESC;
END;
$$;

-- Trigger pour updated_at sur morceaux
CREATE TRIGGER update_morceaux_updated_at
  BEFORE UPDATE ON morceaux
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index pour les performances
CREATE INDEX IF NOT EXISTS morceaux_nom_idx ON morceaux USING btree (nom);
CREATE INDEX IF NOT EXISTS morceaux_created_at_idx ON morceaux USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS morceau_orchestras_morceau_idx ON morceau_orchestras USING btree (morceau_id);
CREATE INDEX IF NOT EXISTS morceau_orchestras_orchestra_idx ON morceau_orchestras USING btree (orchestra_id);
CREATE INDEX IF NOT EXISTS partitions_morceau_idx ON partitions USING btree (morceau_id);