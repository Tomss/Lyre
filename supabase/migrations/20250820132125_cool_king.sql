/*
  # Add relationship between partitions and morceaux

  1. Schema Changes
    - Add `morceau_id` column to `partitions` table
    - Create foreign key constraint to `morceaux` table
    - Add index for performance

  2. Data Migration
    - This migration assumes existing partitions data needs to be handled
    - The column is added as nullable initially to avoid breaking existing data

  3. Security
    - No RLS changes needed as existing policies will apply
*/

-- Add morceau_id column to partitions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partitions' AND column_name = 'morceau_id'
  ) THEN
    ALTER TABLE partitions ADD COLUMN morceau_id uuid;
  END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'partitions_morceau_id_fkey'
  ) THEN
    ALTER TABLE partitions 
    ADD CONSTRAINT partitions_morceau_id_fkey 
    FOREIGN KEY (morceau_id) REFERENCES morceaux(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'partitions_morceau_idx'
  ) THEN
    CREATE INDEX partitions_morceau_idx ON partitions(morceau_id);
  END IF;
END $$;