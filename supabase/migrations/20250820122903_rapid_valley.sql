/*
  # Create partitions table and management system

  1. New Tables
    - `partitions`
      - `id` (uuid, primary key)
      - `title` (text, required) - Titre de la partition
      - `instrument_id` (uuid, foreign key) - Lié à instruments
      - `voice` (text, optional) - Description de la voie
      - `orchestra_id` (uuid, foreign key) - Lié à orchestras
      - `file_name` (text, required) - Nom du fichier
      - `file_path` (text, required) - Chemin/URL du fichier
      - `file_type` (text, required) - Type de fichier (pdf/image)
      - `file_size` (bigint, optional) - Taille du fichier
      - `mime_type` (text, optional) - Type MIME
      - `created_by` (uuid, foreign key) - Créé par (admin)
      - `created_at` (timestamp) - Date de création
      - `updated_at` (timestamp) - Date de mise à jour

  2. Security
    - Enable RLS on `partitions` table
    - Admin et gestionnaire peuvent tout gérer
    - Utilisateurs peuvent lire leurs partitions (selon instrument + orchestre)

  3. Functions
    - `get_user_partitions(user_id)` - Récupère les partitions d'un utilisateur
    - Trigger pour updated_at

  4. Indexes
    - Index sur instrument_id, orchestra_id, created_at pour les performances
*/

-- Créer la table partitions
CREATE TABLE IF NOT EXISTS partitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  instrument_id uuid NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  voice text,
  orchestra_id uuid NOT NULL REFERENCES orchestras(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('pdf', 'image')),
  file_size bigint,
  mime_type text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE partitions ENABLE ROW LEVEL SECURITY;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS partitions_instrument_idx ON partitions(instrument_id);
CREATE INDEX IF NOT EXISTS partitions_orchestra_idx ON partitions(orchestra_id);
CREATE INDEX IF NOT EXISTS partitions_created_at_idx ON partitions(created_at DESC);

-- Politiques RLS
CREATE POLICY "Admin et gestionnaire peuvent gérer les partitions"
  ON partitions
  FOR ALL
  TO authenticated
  USING (get_my_role() = ANY(ARRAY['Admin'::text, 'Gestionnaire'::text]))
  WITH CHECK (get_my_role() = ANY(ARRAY['Admin'::text, 'Gestionnaire'::text]));

CREATE POLICY "Utilisateurs peuvent lire leurs partitions"
  ON partitions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM user_instruments ui
      JOIN user_orchestras uo ON uo.user_id = ui.user_id
      WHERE ui.user_id = auth.uid()
        AND ui.instrument_id = partitions.instrument_id
        AND uo.orchestra_id = partitions.orchestra_id
    )
  );

-- Fonction pour récupérer les partitions d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_partitions(user_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  voice text,
  file_name text,
  file_path text,
  file_type text,
  file_size bigint,
  mime_type text,
  created_at timestamptz,
  updated_at timestamptz,
  instruments json,
  orchestras json,
  profiles json
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.voice,
    p.file_name,
    p.file_path,
    p.file_type,
    p.file_size,
    p.mime_type,
    p.created_at,
    p.updated_at,
    json_build_object('id', i.id, 'name', i.name) as instruments,
    json_build_object('id', o.id, 'name', o.name) as orchestras,
    CASE 
      WHEN pr.first_name IS NOT NULL THEN 
        json_build_object('first_name', pr.first_name, 'last_name', pr.last_name)
      ELSE NULL 
    END as profiles
  FROM partitions p
  JOIN instruments i ON p.instrument_id = i.id
  JOIN orchestras o ON p.orchestra_id = o.id
  LEFT JOIN profiles pr ON p.created_by = pr.id
  WHERE EXISTS (
    SELECT 1 
    FROM user_instruments ui
    JOIN user_orchestras uo ON uo.user_id = ui.user_id
    WHERE ui.user_id = user_id
      AND ui.instrument_id = p.instrument_id
      AND uo.orchestra_id = p.orchestra_id
  )
  ORDER BY p.created_at DESC;
END;
$$;

-- Trigger pour updated_at
CREATE TRIGGER update_partitions_updated_at
  BEFORE UPDATE ON partitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();