CREATE TABLE `carousel_images` (
  `id` varchar(36) NOT NULL,
  `image_url` text NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `event_orchestras` (
  `id` varchar(36) NOT NULL,
  `event_id` varchar(36) NOT NULL,
  `orchestra_id` varchar(36) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_orchestras_event_id_fkey` (`event_id`),
  KEY `event_orchestras_orchestra_id_fkey` (`orchestra_id`),
  CONSTRAINT `event_orchestras_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`),
  CONSTRAINT `event_orchestras_orchestra_id_fkey` FOREIGN KEY (`orchestra_id`) REFERENCES `orchestras` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_orchestras` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `orchestra_id` varchar(36) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_orchestras_user_id_fkey` (`user_id`),
  KEY `user_orchestras_orchestra_id_fkey` (`orchestra_id`),
  CONSTRAINT `user_orchestras_orchestra_id_fkey` FOREIGN KEY (`orchestra_id`) REFERENCES `orchestras` (`id`),
  CONSTRAINT `user_orchestras_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_instruments` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `instrument_id` varchar(36) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_instruments_user_id_fkey` (`user_id`),
  KEY `user_instruments_instrument_id_fkey` (`instrument_id`),
  CONSTRAINT `user_instruments_instrument_id_fkey` FOREIGN KEY (`instrument_id`) REFERENCES `instruments` (`id`),
  CONSTRAINT `user_instruments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `site_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `profiles` (
  `id` varchar(36) NOT NULL,
  `first_name` text,
  `last_name` text,
  `role` enum('Membre','Admin','Professeur','Gestionnaire') DEFAULT 'Membre',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `profiles_id_fkey` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `partitions` (
  `id` varchar(36) NOT NULL,
  `nom` text NOT NULL,
  `morceau_id` varchar(36) NOT NULL,
  `instrument_id` varchar(36) NOT NULL,
  `file_path` text,
  `file_name` text,
  `file_type` enum('pdf','image') DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `partitions_morceau_id_fkey` (`morceau_id`),
  KEY `partitions_instrument_id_fkey` (`instrument_id`),
  CONSTRAINT `partitions_instrument_id_fkey` FOREIGN KEY (`instrument_id`) REFERENCES `instruments` (`id`),
  CONSTRAINT `partitions_morceau_id_fkey` FOREIGN KEY (`morceau_id`) REFERENCES `morceaux` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `orchestras` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `photo_url` text,
  `display_order` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `orchestra_photos` (
  `id` varchar(36) NOT NULL,
  `orchestra_id` varchar(36) NOT NULL,
  `photo_url` text,
  `display_order` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `orchestra_photos_orchestra_id_fkey` (`orchestra_id`),
  CONSTRAINT `orchestra_photos_orchestra_id_fkey` FOREIGN KEY (`orchestra_id`) REFERENCES `orchestras` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `morceaux` (
  `id` varchar(36) NOT NULL,
  `nom` text NOT NULL,
  `compositeur` text,
  `arrangement` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `morceau_orchestras` (
  `id` varchar(36) NOT NULL,
  `morceau_id` varchar(36) NOT NULL,
  `orchestra_id` varchar(36) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `morceau_orchestras_morceau_id_fkey` (`morceau_id`),
  KEY `morceau_orchestras_orchestra_id_fkey` (`orchestra_id`),
  CONSTRAINT `morceau_orchestras_morceau_id_fkey` FOREIGN KEY (`morceau_id`) REFERENCES `morceaux` (`id`),
  CONSTRAINT `morceau_orchestras_orchestra_id_fkey` FOREIGN KEY (`orchestra_id`) REFERENCES `orchestras` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `media_items` (
  `id` varchar(36) NOT NULL,
  `title` text NOT NULL,
  `description` text,
  `media_type` enum('album','lyrissimot','journal','video','audio','galerie') NOT NULL,
  `created_by` varchar(36) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `is_featured` tinyint(1) DEFAULT '0',
  `published` tinyint(1) DEFAULT '1',
  `media_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `media_items_created_by_fkey` (`created_by`),
  CONSTRAINT `media_items_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `media_files` (
  `id` varchar(36) NOT NULL,
  `media_item_id` varchar(36) DEFAULT NULL,
  `file_name` text NOT NULL,
  `file_path` text NOT NULL,
  `file_type` enum('video','audio','image','document','pdf') NOT NULL,
  `file_size` bigint DEFAULT NULL,
  `mime_type` text,
  `alt_text` text,
  `sort_order` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `media_files_media_item_id_fkey` (`media_item_id`),
  CONSTRAINT `media_files_media_item_id_fkey` FOREIGN KEY (`media_item_id`) REFERENCES `media_items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `instruments` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `photo_url` text,
  `teacher` text,
  `description` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `events` (
  `id` varchar(36) NOT NULL,
  `title` text NOT NULL,
  `description` text,
  `event_type` enum('concert','repetition','reunion','autre') NOT NULL DEFAULT 'concert',
  `event_date` datetime NOT NULL,
  `location` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `practical_info` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `page_headers` (
  `id` varchar(36) NOT NULL,
  `page_slug` varchar(50) NOT NULL,
  `image_url` text NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `page_slug` (`page_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `partners` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `logo_url` text NOT NULL,
  `description` text,
  `website_url` text,
  `display_order` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
