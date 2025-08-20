/*
  # Fonction pour récupérer les partitions d'un utilisateur

  1. Fonction RPC
    - `get_user_partitions(user_id uuid)`
    - Retourne les partitions accessibles à l'utilisateur
    - Basé sur ses instruments et orchestres

  2. Logique
    - Utilisateur doit jouer l'instrument de la partition
    - Utilisateur doit faire partie de l'orchestre de la partition
    - Les deux conditions doivent être remplies
*/

-- Fonction pour récupérer les partitions d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_partitions(user_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  voice text,
  file_name text,
  file_path text,
  file_type text,
  file_size bigint,
  mime_type text,
  created_at timestamptz,
  updated_at timestamptz,
  instruments json,
  orchestras json,
  profiles json
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.voice,
    p.file_name,
    p.file_path,
    p.file_type,
    p.file_size,
    p.mime_type,
    p.created_at,
    p.updated_at,
    json_build_object('id', i.id, 'name', i.name) as instruments,
    json_build_object('id', o.id, 'name', o.name) as orchestras,
    json_build_object('first_name', pr.first_name, 'last_name', pr.last_name) as profiles
  FROM partitions p
  JOIN instruments i ON p.instrument_id = i.id
  JOIN orchestras o ON p.orchestra_id = o.id
  LEFT JOIN profiles pr ON p.created_by = pr.id
  WHERE EXISTS (
    SELECT 1 FROM user_instruments ui 
    WHERE ui.user_id = get_user_partitions.user_id 
    AND ui.instrument_id = p.instrument_id
  )
  AND EXISTS (
    SELECT 1 FROM user_orchestras uo 
    WHERE uo.user_id = get_user_partitions.user_id 
    AND uo.orchestra_id = p.orchestra_id
  )
  ORDER BY p.created_at DESC;
END;
$$;