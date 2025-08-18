/*
  # Add date field to media items

  1. Changes
    - Add `media_date` column to `media_items` table
    - Set default to current date for existing records
    - Allow NULL for future flexibility

  2. Notes
    - This date represents when the media content was created/recorded
    - Different from `created_at` which is when the record was added to the system
*/

-- Add media_date column to media_items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'media_items' AND column_name = 'media_date'
  ) THEN
    ALTER TABLE media_items ADD COLUMN media_date date;
  END IF;
END $$;