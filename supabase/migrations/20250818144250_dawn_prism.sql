/*
  # Add media_date column to media_items table

  1. Changes
    - Add `media_date` column to `media_items` table
    - Type: DATE (for storing media creation/recording date)
    - Nullable: true (optional field)

  2. Purpose
    - Allow storing the actual date when media content was created/recorded
    - Different from created_at which is when the record was added to database
*/

-- Add media_date column to media_items table
ALTER TABLE media_items ADD COLUMN IF NOT EXISTS media_date DATE;