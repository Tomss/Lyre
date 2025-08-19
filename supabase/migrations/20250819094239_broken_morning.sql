/*
  # Add photo field to orchestras

  1. Changes
    - Add `photo_url` column to `orchestras` table
    - Column is optional (nullable) for existing orchestras
    - Will store the URL of the orchestra photo

  2. Notes
    - Existing orchestras will have NULL photo_url by default
    - New orchestras can optionally include a photo
*/

-- Add photo_url column to orchestras table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orchestras' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE orchestras ADD COLUMN photo_url TEXT;
  END IF;
END $$;