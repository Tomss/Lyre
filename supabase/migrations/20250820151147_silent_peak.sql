/*
  # Remove unique constraint on partitions

  1. Changes
    - Remove unique constraint on (morceau_id, instrument_id) from partitions table
    - Allow multiple partitions for same morceau + instrument combination
    - This enables multiple parts like "Trompette 1", "Trompette 2" for same piece

  2. Rationale
    - Musical pieces often have multiple parts for the same instrument
    - Example: Trumpet 1, Trumpet 2, Trumpet 3 parts for same composition
    - Constraint was too restrictive for real-world musical arrangements
*/

-- Remove the unique constraint that prevents multiple partitions 
-- for the same morceau + instrument combination
ALTER TABLE partitions DROP CONSTRAINT IF EXISTS partitions_morceau_id_instrument_id_key;

-- Remove the corresponding unique index as well
DROP INDEX IF EXISTS partitions_morceau_id_instrument_id_key;