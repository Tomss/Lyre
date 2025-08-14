/*
  # Fonctions pour la gestion des utilisateurs

  1. Nouvelles fonctions
    - `get_my_role()` - Récupère le rôle de l'utilisateur connecté
    - `uid()` - Récupère l'ID de l'utilisateur connecté
  
  2. Sécurité
    - Fonctions sécurisées pour RLS
    - Accès admin uniquement pour certaines opérations
*/

-- Fonction pour récupérer l'ID de l'utilisateur connecté
CREATE OR REPLACE FUNCTION uid() 
RETURNS uuid 
LANGUAGE sql 
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- Fonction pour récupérer le rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION get_my_role() 
RETURNS text 
LANGUAGE sql 
SECURITY DEFINER
AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid();
$$;

-- Fonction pour récupérer tous les utilisateurs (admin seulement)
CREATE OR REPLACE FUNCTION get_all_users_with_profiles()
RETURNS TABLE (
  id uuid,
  email text,
  first_name text,
  last_name text,
  role user_role,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    au.email,
    p.first_name,
    p.last_name,
    p.role,
    p.updated_at
  FROM profiles p
  JOIN auth.users au ON p.id = au.id
  WHERE get_my_role() = 'Admin';
$$;