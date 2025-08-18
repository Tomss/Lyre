/*
  # Système de gestion des événements

  1. Nouvelles tables
    - `events`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, optional)
      - `event_type` (enum: 'concert' ou 'repetition')
      - `event_date` (timestamptz, required)
      - `location` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `event_orchestras`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `orchestra_id` (uuid, foreign key to orchestras)
      - `created_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour admin et lecture publique des concerts
    - Policies pour lecture privée des répétitions
*/

-- Créer le type enum pour les événements
CREATE TYPE event_type AS ENUM ('concert', 'repetition');

-- Table des événements
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type event_type NOT NULL DEFAULT 'concert',
  event_date timestamptz NOT NULL,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table de liaison événements-orchestres (many-to-many)
CREATE TABLE IF NOT EXISTS event_orchestras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  orchestra_id uuid NOT NULL REFERENCES orchestras(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, orchestra_id)
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_orchestras ENABLE ROW LEVEL SECURITY;

-- Policies pour events
CREATE POLICY "Admin can manage all events"
  ON events
  FOR ALL
  TO authenticated
  USING (get_my_role() = 'Admin')
  WITH CHECK (get_my_role() = 'Admin');

CREATE POLICY "Anyone can read concerts"
  ON events
  FOR SELECT
  TO authenticated
  USING (event_type = 'concert');

CREATE POLICY "Users can read events from their orchestras"
  ON events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_orchestras eo
      JOIN user_orchestras uo ON eo.orchestra_id = uo.orchestra_id
      WHERE eo.event_id = events.id AND uo.user_id = auth.uid()
    )
  );

-- Policies pour event_orchestras
CREATE POLICY "Admin can manage all event orchestras"
  ON event_orchestras
  FOR ALL
  TO authenticated
  USING (get_my_role() = 'Admin')
  WITH CHECK (get_my_role() = 'Admin');

CREATE POLICY "Users can read event orchestras for concerts"
  ON event_orchestras
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_orchestras.event_id AND e.event_type = 'concert'
    )
  );

CREATE POLICY "Users can read event orchestras for their orchestras"
  ON event_orchestras
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_orchestras uo
      WHERE uo.orchestra_id = event_orchestras.orchestra_id AND uo.user_id = auth.uid()
    )
  );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();