-- 🚀 MIGRATION SQL POUR RAILWAY (26/03/2026)

-- 1. Création de la table activity_log (Nécessaire pour les notifications)
CREATE TABLE IF NOT EXISTS `activity_log` (
  `id` varchar(36) NOT NULL,
  `type` enum('event','partition','news') NOT NULL,
  `action` text NOT NULL,
  `entity_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `activity_log_user_id_fkey` (`user_id`),
  CONSTRAINT `activity_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Vérification/Ajout de colonnes created_at si absentes (Optionnel si déjà présentes)
-- ALTER TABLE `morceaux` ADD COLUMN IF NOT EXISTS `created_at` datetime DEFAULT CURRENT_TIMESTAMP;
-- ALTER TABLE `partitions` ADD COLUMN IF NOT EXISTS `created_at` datetime DEFAULT CURRENT_TIMESTAMP;

-- 3. Mise à jour de l'historique (Note: SQL Query modifiée dans le backend pour 15 jours)
