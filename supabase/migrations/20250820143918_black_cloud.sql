/*
  # Remove années column from morceaux table

  1. Changes
    - Remove `annees` column from `morceaux` table
    - This column was used to track which years a piece was performed
    - Simplifying the data structure as requested

  2. Security
    - No changes to RLS policies needed
    - Existing policies remain intact
*/

-- Remove the annees column from morceaux table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'morceaux' AND column_name = 'annees'
  ) THEN
    ALTER TABLE morceaux DROP COLUMN annees;
  END IF;
END $$;