/*
  # Nettoyage de la table partitions

  1. Suppressions
    - Suppression de la colonne `voice` (plus utilisée)
    - Suppression de la colonne `orchestra_id` (redondante avec morceau_orchestras)
    - Suppression de l'index `partitions_orchestra_idx`
    - Suppression de la contrainte de clé étrangère `partitions_orchestra_id_fkey`

  2. Justification
    - `orchestra_id` : L'orchestre est déjà géré au niveau du morceau via `morceau_orchestras`
    - `voice` : Champ plus utilisé dans l'interface
    - Simplification de la structure de données
*/

-- Supprimer la contrainte de clé étrangère pour orchestra_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'partitions_orchestra_id_fkey'
    AND table_name = 'partitions'
  ) THEN
    ALTER TABLE partitions DROP CONSTRAINT partitions_orchestra_id_fkey;
  END IF;
END $$;

-- Supprimer l'index sur orchestra_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'partitions_orchestra_idx'
  ) THEN
    DROP INDEX partitions_orchestra_idx;
  END IF;
END $$;

-- Supprimer la colonne orchestra_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partitions' AND column_name = 'orchestra_id'
  ) THEN
    ALTER TABLE partitions DROP COLUMN orchestra_id;
  END IF;
END $$;

-- Supprimer la colonne voice
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partitions' AND column_name = 'voice'
  ) THEN
    ALTER TABLE partitions DROP COLUMN voice;
  END IF;
END $$;