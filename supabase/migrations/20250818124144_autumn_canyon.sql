/*
  # Système de gestion des médias

  1. Nouvelles tables
    - `media_types` - Types de médias (albums, enregistrements, journaux, lyrissimots)
    - `media_items` - Éléments de médias principaux
    - `media_files` - Fichiers associés aux médias
  
  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques pour admin/gestionnaire (création/modification)
    - Lecture publique pour tous les utilisateurs authentifiés
*/

-- Enum pour les types de médias
CREATE TYPE media_type AS ENUM ('album', 'enregistrement', 'journal', 'lyrissimot');

-- Enum pour les types de fichiers
CREATE TYPE file_type AS ENUM ('image', 'video', 'audio', 'pdf');

-- Table des éléments de médias principaux
CREATE TABLE IF NOT EXISTS media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  media_type media_type NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_featured boolean DEFAULT false,
  published boolean DEFAULT true
);

-- Table des fichiers associés aux médias
CREATE TABLE IF NOT EXISTS media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_item_id uuid REFERENCES media_items(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type file_type NOT NULL,
  file_size bigint,
  mime_type text,
  alt_text text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS media_items_type_idx ON media_items(media_type);
CREATE INDEX IF NOT EXISTS media_items_created_at_idx ON media_items(created_at DESC);
CREATE INDEX IF NOT EXISTS media_files_media_item_idx ON media_files(media_item_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_media_items_updated_at 
    BEFORE UPDATE ON media_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Politiques pour media_items
CREATE POLICY "Tous peuvent lire les médias publiés"
  ON media_items
  FOR SELECT
  TO authenticated
  USING (published = true);

CREATE POLICY "Admin et gestionnaire peuvent tout gérer"
  ON media_items
  FOR ALL
  TO authenticated
  USING (get_my_role() IN ('Admin', 'Gestionnaire'))
  WITH CHECK (get_my_role() IN ('Admin', 'Gestionnaire'));

-- Politiques pour media_files
CREATE POLICY "Tous peuvent lire les fichiers des médias publiés"
  ON media_files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM media_items 
      WHERE media_items.id = media_files.media_item_id 
      AND media_items.published = true
    )
  );

CREATE POLICY "Admin et gestionnaire peuvent gérer les fichiers"
  ON media_files
  FOR ALL
  TO authenticated
  USING (get_my_role() IN ('Admin', 'Gestionnaire'))
  WITH CHECK (get_my_role() IN ('Admin', 'Gestionnaire'));