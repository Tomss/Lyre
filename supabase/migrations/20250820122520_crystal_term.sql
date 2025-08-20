/*
  # Système de gestion des partitions

  1. Nouvelles Tables
    - `partitions`
      - `id` (uuid, primary key)
      - `title` (text, titre de la partition)
      - `instrument_id` (uuid, lié à instruments)
      - `voice` (text, description de la voie)
      - `orchestra_id` (uuid, lié à orchestras)
      - `file_name` (text, nom du fichier)
      - `file_path` (text, chemin du fichier)
      - `file_type` (enum, 'pdf' ou 'image')
      - `file_size` (bigint, taille du fichier)
      - `mime_type` (text, type MIME)
      - `created_by` (uuid, créateur)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Enable RLS sur `partitions`
    - Politique Admin/Gestionnaire pour gestion complète
    - Politique utilisateurs pour lecture de leurs partitions

  3. Fonctions
    - Trigger pour updated_at
    - Fonction pour récupérer les partitions utilisateur
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

-- Politiques RLS
CREATE POLICY "Admin et gestionnaire peuvent tout gérer"
  ON partitions
  FOR ALL
  TO authenticated
  USING (get_my_role() = ANY (ARRAY['Admin'::text, 'Gestionnaire'::text]))
  WITH CHECK (get_my_role() = ANY (ARRAY['Admin'::text, 'Gestionnaire'::text]));

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

-- Trigger pour updated_at
CREATE TRIGGER update_partitions_updated_at
  BEFORE UPDATE ON partitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index pour les performances
CREATE INDEX IF NOT EXISTS partitions_instrument_idx ON partitions(instrument_id);
CREATE INDEX IF NOT EXISTS partitions_orchestra_idx ON partitions(orchestra_id);
CREATE INDEX IF NOT EXISTS partitions_created_at_idx ON partitions(created_at DESC);