/*
  # Nettoyage des tables morceaux et partitions

  1. Suppression des tables
    - Suppression de la table `partitions`
    - Suppression de la table `morceau_orchestras`
    - Suppression de la table `morceaux`

  2. Nettoyage
    - Suppression des contraintes et index associés
    - Nettoyage complet pour repartir sur de bonnes bases
*/

-- Supprimer les tables dans l'ordre des dépendances
DROP TABLE IF EXISTS partitions CASCADE;
DROP TABLE IF EXISTS morceau_orchestras CASCADE;
DROP TABLE IF EXISTS morceaux CASCADE;