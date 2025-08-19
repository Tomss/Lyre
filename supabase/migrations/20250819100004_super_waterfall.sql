/*
  # Add fields to instruments table

  1. New Fields
    - `photo_url` (text, nullable) - URL or path to instrument photo/logo
    - `teacher` (text, nullable) - Name of the instrument teacher
    - `description` (text, nullable) - Optional description of the instrument/class

  2. Changes
    - Add new columns to existing instruments table
    - Use IF NOT EXISTS to prevent errors if columns already exist
*/

DO $$
BEGIN
  -- Add photo_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instruments' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE instruments ADD COLUMN photo_url text;
  END IF;

  -- Add teacher column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instruments' AND column_name = 'teacher'
  ) THEN
    ALTER TABLE instruments ADD COLUMN teacher text;
  END IF;

  -- Add description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instruments' AND column_name = 'description'
  ) THEN
    ALTER TABLE instruments ADD COLUMN description text;
  END IF;
END $$;