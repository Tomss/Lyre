/*
  # Create partitions table

  1. New Tables
    - `partitions`
      - `id` (uuid, primary key)
      - `nom` (text, required)
      - `morceau_id` (uuid, foreign key to morceaux, required)
      - `instrument_id` (uuid, foreign key to instruments, required)
      - `file_path` (text, path to PDF/image file, optional)
      - `file_name` (text, original filename, optional)
      - `file_type` (text, 'pdf' or 'image', optional)
      - `file_size` (bigint, file size in bytes, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `partitions` table
    - Add policies for Admin/Gestionnaire to manage partitions
    - Add policy for all authenticated users to read partitions

  3. Indexes
    - Index on morceau_id for performance
    - Index on instrument_id for performance
    - Unique constraint on (morceau_id, instrument_id) to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS partitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  morceau_id uuid NOT NULL REFERENCES morceaux(id) ON DELETE CASCADE,
  instrument_id uuid NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  file_path text,
  file_name text,
  file_type text CHECK (file_type IN ('pdf', 'image')),
  file_size bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(morceau_id, instrument_id)
);

-- Enable RLS
ALTER TABLE partitions ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS partitions_morceau_idx ON partitions(morceau_id);
CREATE INDEX IF NOT EXISTS partitions_instrument_idx ON partitions(instrument_id);

-- RLS Policies
CREATE POLICY "Admin et gestionnaire peuvent gérer les partitions"
  ON partitions
  FOR ALL
  TO authenticated
  USING (get_my_role() = ANY (ARRAY['Admin'::text, 'Gestionnaire'::text]))
  WITH CHECK (get_my_role() = ANY (ARRAY['Admin'::text, 'Gestionnaire'::text]));

CREATE POLICY "Tous peuvent lire les partitions"
  ON partitions
  FOR SELECT
  TO authenticated
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_partitions_updated_at
  BEFORE UPDATE ON partitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();