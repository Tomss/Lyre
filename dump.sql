-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: lyredb
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `carousel_images`
--

DROP TABLE IF EXISTS `carousel_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carousel_images`
--

LOCK TABLES `carousel_images` WRITE;
/*!40000 ALTER TABLE `carousel_images` DISABLE KEYS */;
INSERT INTO `carousel_images` VALUES ('9bf2f528-6b7e-4e5d-835f-cb411f13eee1','https://res.cloudinary.com/dr2sbjrms/image/upload/v1773134661/lyre-uploads/zoyndadchtwuq2cttvtw.jpg','','',0,1,'2026-03-10 09:24:20');
/*!40000 ALTER TABLE `carousel_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_orchestras`
--

DROP TABLE IF EXISTS `event_orchestras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_orchestras`
--

LOCK TABLES `event_orchestras` WRITE;
/*!40000 ALTER TABLE `event_orchestras` DISABLE KEYS */;
INSERT INTO `event_orchestras` VALUES ('11127e28-d825-4309-b5a3-5193c07cdd2e','1cd015a0-2399-4c63-ba6a-a8c656b6f1f3','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-01-31 11:52:38'),('13d6e283-331a-4ac6-a2d1-b42695e0369a','70022f6f-b8db-49e1-9eba-f441490a9e48','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-01-31 11:57:37'),('1c574bb7-3c1b-4752-848e-e2b5ba1c7da9','b830247f-0173-4df5-8fd9-d0169527a955','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-01-31 11:59:19'),('1d5c0ba8-74f6-49d4-a11d-a11750bdce98','ab416a24-2c06-4846-900c-da4c08754725','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-01-31 11:52:38'),('1db30330-bef1-472f-9427-5d9af70eaeba','8efc6fad-acb2-433a-970e-76909e14138a','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-01-31 11:52:38'),('2bcad0d5-f39c-4e8a-be5b-aec46a35b430','9449b9c7-9370-43f6-97a4-1486b6605170','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-01-31 11:57:08'),('34c9e945-bd80-4d91-be61-5059fad9f70f','b0f4ac97-c1c8-480c-8c2e-08901ba28dc1','c810fe3a-f753-49e3-a664-6a2c3d58ceb9','2026-01-31 11:52:38'),('3b4f5191-b79c-42d1-988f-0c4af96d4fbc','2a9d7b69-ad30-4343-989a-e180c7754180','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-01-31 11:52:38'),('3ebaa0e2-775d-49ba-a699-eb1409068dab','c937fe07-4c92-4fba-9382-3a534aaa0aab','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-01-31 11:52:38'),('43302368-de36-43d5-87f1-68a0a7f12972','703017a8-f4c9-410f-b489-64c725f679be','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-01-31 11:52:38'),('43c4a53a-2f2a-4dca-8b9b-fefbe6a209cc','d77f7370-a06a-41a3-a918-3d0f9fdb2fca','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-01-31 11:52:38'),('62079f81-1046-471b-9a47-4fb518b6a05a','3652613c-f0fd-4dbc-941b-99bf6f20bd5a','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-01-31 11:52:38'),('69862d40-bbd3-4314-a9cd-eff30b6b2235','1b761f11-bbbf-45ce-9716-89ec412a90cc','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-01-31 11:52:38'),('6c785e4b-d47c-46e1-b9a8-5b2bd8227a7a','b5bb6271-86c8-4b7c-98e1-09f14b74aef7','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-01-31 11:52:38'),('82a55081-a8c7-482f-ade4-51a26d3157fc','94d20bac-3139-416c-bf49-37b9ccd4800f','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-01-31 11:52:38'),('84a3537b-d463-4972-81f7-11970e7659c5','83e0df4f-5c2f-44fd-9ca7-9081820a02a1','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-01-31 11:52:38'),('9df846a5-7a75-4cbd-809b-d308750d9be0','b0f4ac97-c1c8-480c-8c2e-08901ba28dc1','e41da1e5-303f-462d-bd6e-ff0464fec5a3','2026-01-31 11:52:38'),('9e25a156-b52f-459e-94c1-831dac3d8498','145ca2ef-ef44-4082-a59a-4a9234e3132f','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-01-31 11:52:38'),('a9c144fc-694e-49d0-bf96-5266b778f2fd','02e60ebc-a0b4-4d27-8dfb-b1e497b67cf5','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-02-06 16:31:44'),('abfe8fe9-8aed-4b02-bd38-b7d5487db52b','8624424c-26b5-4f88-8d70-732cf125689f','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-01-31 11:52:38'),('b1e0bda0-dbf6-473f-b8e9-0afd5aeae867','1581ec8e-8b03-4114-9bfb-54471b9f62aa','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-01-31 11:52:38'),('b351a98d-98b9-4888-8696-c6290bf4dd4e','00b4e6d9-293f-4b8b-8519-a05a11c811db','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-02-06 16:32:04'),('b9e6b4d0-4d2c-42dd-b41a-df27cc872980','b0f4ac97-c1c8-480c-8c2e-08901ba28dc1','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-01-31 11:52:38'),('d67c0e3f-9940-4e77-bc46-2c1a266c5e17','703017a8-f4c9-410f-b489-64c725f679be','e41da1e5-303f-462d-bd6e-ff0464fec5a3','2026-01-31 11:52:38'),('faf592a4-a334-4d67-8750-8dc185241eeb','52017065-d106-472b-8fdb-cce78ef05376','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2026-01-31 11:59:25');
/*!40000 ALTER TABLE `event_orchestras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` varchar(36) NOT NULL,
  `title` text NOT NULL,
  `description` text,
  `event_type` enum('concert','repetition','divers') NOT NULL,
  `event_date` datetime NOT NULL,
  `location` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `practical_info` text,
  `is_public` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES ('00b4e6d9-293f-4b8b-8519-a05a11c811db','Répétition du GRAND ORCHESTRE','','repetition','2026-02-13 19:30:00','','2026-02-06 16:32:04','2026-02-06 16:32:04','',0),('02e60ebc-a0b4-4d27-8dfb-b1e497b67cf5','Répétition du GRAND ORCHESTRE','','repetition','2026-02-06 19:30:00','','2026-02-06 16:31:44','2026-02-06 16:31:44','',0),('145ca2ef-ef44-4082-a59a-4a9234e3132f','Répétition du GRAND ORCHESTRE',NULL,'repetition','2026-05-09 17:00:00',NULL,'2026-01-31 11:52:38','2026-01-31 11:52:38',NULL,0),('1581ec8e-8b03-4114-9bfb-54471b9f62aa','Répétition du GRAND ORCHESTRE',NULL,'repetition','2026-03-14 17:00:00',NULL,'2026-01-31 11:52:38','2026-01-31 11:52:38',NULL,0),('1997eb49-033f-4680-b319-da17ada604ea','Rencontre des classes d’orchestre','Samedi 13 et Dimanche 14 juin. Avec Bourbonne, Chalindrey, Saint Appolinaire, Arcis sur Aube et Brienne Le Château. Présence T.Deleruyelle.','concert','2026-06-13 10:00:00','Bourbonne Les Bains','2026-01-31 11:52:38','2026-01-31 11:52:38',NULL,1),('1b761f11-bbbf-45ce-9716-89ec412a90cc','Répétition du GRAND ORCHESTRE',NULL,'repetition','2026-03-21 17:00:00',NULL,'2026-01-31 11:52:38','2026-01-31 11:52:38',NULL,0),('1cd015a0-2399-4c63-ba6a-a8c656b6f1f3','Répétition du GRAND ORCHESTRE',NULL,'repetition','2026-04-10 19:30:00',NULL,'2026-01-31 11:52:38','2026-01-31 11:52:38',NULL,0),('25191d5a-aeae-4880-b8e5-b2ef5b354ccf','Evaluations instrumentales','Du Mardi 7 au Samedi 11 avril à l\'école de musique','divers','2026-04-07 09:00:00','École de musique','2026-01-31 11:52:38','2026-01-31 11:52:38',NULL,1),('2a9d7b69-ad30-4343-989a-e180c7754180','Répétition du GRAND ORCHESTRE',NULL,'repetition','2026-01-31 17:00:00',NULL,'2026-01-31 11:52:38','2026-01-31 11:52:38',NULL,0),('3652613c-f0fd-4dbc-941b-99bf6f20bd5a','Répétition du GRAND ORCHESTRE',NULL,'repetition','2026-02-14 17:00:00',NULL,'2026-01-31 11:52:38','2026-01-31 11:52:38',NULL,0),('41030e07-d415-472e-8b9c-4f49f8de4045','31ème STAGE D’ORCHESTRE','Du Lundi 6 au Vendredi 10 juillet','divers','2026-07-06 09:00:00',NULL,'2026-01-31 11:52:38','2026-01-31 11:52:38',NULL,1),('52017065-d106-472b-8fdb-cce78ef05376','Fête de la musique','','concert','2026-06-20 16:00:00','Chalindrey','2026-01-31 11:52:38','2026-01-31 11:52:38','',1),('70022f6f-b8db-49e1-9eba-f441490a9e48','Concert Annuel','Avec en orchestre invité l\'harmonie d\'Is Sur Tille','concert','2026-03-28 19:00:00','Centre socioculturel','2026-01-31 11:52:38','2026-01-31 11:52:38','',1),('703017a8-f4c9-410f-b489-64c725f679be','Cérémonies patriotiques',NULL,'concert','2026-05-08 10:00:00',NULL,'2026-01-31 11:52:38','2026-01-31 11:52:38',NULL,1),('83e0df4f-5c2f-44fd-9ca7-9081820a02a1','Répétition du GRAND ORCHESTRE',NULL,'repetition','2026-03-07 17:00:00',NULL,'2026-01-31 11:52:38','2026-01-31 11:52:38',NULL,0),('8624424c-26b5-4f88-8d70-732cf125689f','Répétition du GRAND ORCHESTRE',NULL,'repetition','2026-04-04 17:00:00',NULL,'2026-01-31 11:52:38','2026-01-31 11:52:38',NULL,0),('8efc6fad-acb2-433a-970e-76909e14138a','Répétition du GRAND ORCHESTRE',NULL,'repetition','2026-01-24 17:00:00',NULL,'2026-01-31 11:52:38','2026-01-31 11:52:38',NULL,0),('9449b9c7-9370-43f6-97a4-1486b6605170','Répétition du GRAND ORCHESTRE','Ou Vendredi 22','repetition','2026-05-23 15:00:00','','2026-01-31 11:52:38','2026-01-31 11:52:38','',0),('94d20bac-3139-416c-bf49-37b9ccd4800f','Fête de l’amitié',NULL,'concert','2026-05-31 10:00:00','Fayl-Billot','2026-01-31 11:52:38','2026-01-31 11:52:38',NULL,1),('ab416a24-2c06-4846-900c-da4c08754725','Répétition du GRAND ORCHESTRE',NULL,'repetition','2026-05-30 17:00:00',NULL,'2026-01-31 11:52:38','2026-01-31 11:52:38',NULL,0),('ae250d8f-db55-476e-89d5-2ce6f73ac2a7','Orchestre Départemental 52 à Chaumont','Du Lundi 16 au Vendredi 20 février','divers','2026-02-16 09:00:00','Chaumont','2026-01-31 11:52:38','2026-01-31 11:52:38',NULL,1),('b0f4ac97-c1c8-480c-8c2e-08901ba28dc1','Retraite aux flambeaux',NULL,'concert','2026-07-13 21:00:00',NULL,'2026-01-31 11:52:38','2026-01-31 11:52:38',NULL,1),('b5bb6271-86c8-4b7c-98e1-09f14b74aef7','Répétition du GRAND ORCHESTRE',NULL,'repetition','2026-05-22 19:30:00',NULL,'2026-01-31 11:52:38','2026-01-31 11:52:38',NULL,0),('b830247f-0173-4df5-8fd9-d0169527a955','5ème ESTIVAL DE CORGIRNON','Toutes activités (sauf grand orchestre). Soirée animée par les professeurs.','concert','2026-06-28 08:00:00','Corgirnon','2026-01-31 11:52:38','2026-01-31 11:52:38','',1),('c937fe07-4c92-4fba-9382-3a534aaa0aab','Répétition générale',NULL,'repetition','2026-03-27 19:30:00','Centre socioculturel','2026-01-31 11:52:38','2026-01-31 11:52:38',NULL,0),('d77f7370-a06a-41a3-a918-3d0f9fdb2fca','Répétition du GRAND ORCHESTRE',NULL,'repetition','2026-05-02 17:00:00',NULL,'2026-01-31 11:52:38','2026-01-31 11:52:38',NULL,0);
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `instruments`
--

DROP TABLE IF EXISTS `instruments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `instruments`
--

LOCK TABLES `instruments` WRITE;
/*!40000 ALTER TABLE `instruments` DISABLE KEYS */;
INSERT INTO `instruments` VALUES ('08dbfcf9-1376-4f75-a704-9bb84bef09ad','Trompette','2025-08-14 12:42:31',NULL,'Christophe GUENON',NULL),('0e690bdd-338a-4e51-8a63-904a5dae6c44','Guitare','2025-08-19 11:44:47',NULL,'Stéphane MARCANGELO',NULL),('18942156-0d3b-4b02-a150-39e672e54132','Flûte Traversière','2025-08-14 12:42:31',NULL,'Laure BARLIER',NULL),('1ab168aa-9848-4f45-b423-9c46c64c174d','Hautbois','2025-08-14 12:42:31',NULL,'Pierre-Alain FALLOT',NULL),('6335920b-8123-43c4-8a15-546431c9d003','Percussions','2025-08-14 12:42:31',NULL,'Blaise BAILLY',NULL),('664b0408-8211-4b06-bc3f-575ea4af6010','Clarinette','2025-08-14 13:13:07',NULL,'Lilian THEVENIN',NULL),('8bbb72e2-df87-4ccb-b43d-9f86cbc2e95b','Cor','2025-08-14 12:42:31',NULL,'Christophe GUENON',NULL),('912f26da-bfc9-46f1-ae91-0a26c354da2d','Contrebasse','2025-08-14 12:42:31',NULL,'Benoît DEVANNE',NULL),('9bae819e-7f71-43ed-8099-a4db23a9210e','Trombone','2025-08-14 12:42:31',NULL,'Nicolas CARDOT',NULL),('c4047c73-0334-4270-8fd5-8b942ad75e32','Tuba','2025-08-14 12:42:31',NULL,'Nicolas CARDOT',NULL),('d5b875f9-5336-4a4b-a345-31ed7ad4fcf9','Saxophone','2025-08-14 12:42:31',NULL,'Damien BONNIN',NULL);
/*!40000 ALTER TABLE `instruments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `media_files`
--

DROP TABLE IF EXISTS `media_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media_files`
--

LOCK TABLES `media_files` WRITE;
/*!40000 ALTER TABLE `media_files` DISABLE KEYS */;
INSERT INTO `media_files` VALUES ('4dec297a-5cfa-4d82-926e-ac2619421076','c3e9262e-b3cf-41c2-b0c0-4e007bb59c53','2025-06-07 Animation Nigloland 1.jpg','http://localhost:3001/uploads/file-1769432363391-396025734.jpg','image',176459,NULL,NULL,0,'2026-01-26 13:59:23'),('50869670-0956-4b6a-b3f9-923ab243d806','c3e9262e-b3cf-41c2-b0c0-4e007bb59c53','2025-06-07 Animation Nigloland 6.jpg','http://localhost:3001/uploads/file-1769432363413-896833511.jpg','image',282183,NULL,NULL,6,'2026-01-26 13:59:23'),('638c0301-5dd0-4aa6-93a2-4b9c67eea4c5','c3e9262e-b3cf-41c2-b0c0-4e007bb59c53','2025-06-07 Animation Nigloland 8.jpg','http://localhost:3001/uploads/file-1769432363405-95774900.jpg','image',191549,NULL,NULL,4,'2026-01-26 13:59:23'),('92f45e01-f1b2-4d2e-9100-21f0c5cd62d2','c3e9262e-b3cf-41c2-b0c0-4e007bb59c53','2025-06-07 Animation Nigloland 4.jpg','http://localhost:3001/uploads/file-1769432363400-973035144.jpg','image',253433,NULL,NULL,2,'2026-01-26 13:59:23'),('ac7c59eb-65c2-4476-8de3-523dee86dd1b','c3e9262e-b3cf-41c2-b0c0-4e007bb59c53','2025-06-07 Animation Nigloland 7.jpg','http://localhost:3001/uploads/file-1769432363409-395019593.jpg','image',193963,NULL,NULL,3,'2026-01-26 13:59:23'),('b961398a-3602-41f4-99ec-d843465455ff','c3e9262e-b3cf-41c2-b0c0-4e007bb59c53','2025-06-07 Animation Nigloland 3.jpg','http://localhost:3001/uploads/file-1769432363411-268372801.jpg','image',247689,NULL,NULL,5,'2026-01-26 13:59:23'),('cbd47cb6-b525-477d-b0fb-13394ec2c19e','c3e9262e-b3cf-41c2-b0c0-4e007bb59c53','2025-06-07 Animation Nigloland 2.jpg','http://localhost:3001/uploads/file-1769432363396-973527104.jpg','image',232244,NULL,NULL,1,'2026-01-26 13:59:23');
/*!40000 ALTER TABLE `media_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `media_items`
--

DROP TABLE IF EXISTS `media_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media_items`
--

LOCK TABLES `media_items` WRITE;
/*!40000 ALTER TABLE `media_items` DISABLE KEYS */;
INSERT INTO `media_items` VALUES ('c3e9262e-b3cf-41c2-b0c0-4e007bb59c53','TEST','TEST','album','29cbd663-433a-45a7-9d30-85e4e4d8dd60','2026-01-26 13:59:23','2026-01-26 13:59:23',0,1,'2026-01-08');
/*!40000 ALTER TABLE `media_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `morceau_orchestras`
--

DROP TABLE IF EXISTS `morceau_orchestras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `morceau_orchestras`
--

LOCK TABLES `morceau_orchestras` WRITE;
/*!40000 ALTER TABLE `morceau_orchestras` DISABLE KEYS */;
INSERT INTO `morceau_orchestras` VALUES ('7a4f0d05-ca0b-4b70-87d5-fcf49e56b9c5','2ac517d0-a660-4417-852d-f76447f41941','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2025-08-20 14:46:49'),('a722c7d7-1130-4b8c-8fd2-450e9293b397','bc141ee7-0bf9-410f-a089-1900b30b391f','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2025-08-21 06:44:16'),('e70c15da-f60d-4afc-863c-ac1c684bed5f','bc141ee7-0bf9-410f-a089-1900b30b391f','0583b6b5-5de8-4c39-889b-5d6644b1ccd9','2025-08-21 06:44:16'),('e85a5cc5-9e6a-400c-a3f9-f5f231f4b1d6','435bd944-7d25-4206-b0f8-a51bbf5566a4','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2025-08-22 16:37:44'),('fb7ac30f-7603-4b63-bb6a-83ce7f39bb1f','5ea3e74c-181f-45a3-94a9-1409a3707869','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2025-10-07 09:57:03');
/*!40000 ALTER TABLE `morceau_orchestras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `morceaux`
--

DROP TABLE IF EXISTS `morceaux`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `morceaux` (
  `id` varchar(36) NOT NULL,
  `nom` text NOT NULL,
  `compositeur` text,
  `arrangement` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `morceaux`
--

LOCK TABLES `morceaux` WRITE;
/*!40000 ALTER TABLE `morceaux` DISABLE KEYS */;
INSERT INTO `morceaux` VALUES ('2ac517d0-a660-4417-852d-f76447f41941','Still Loving You','Scorpions','MCR','2025-08-20 14:46:49','2025-08-20 14:46:49'),('435bd944-7d25-4206-b0f8-a51bbf5566a4','Paris Montmartre','Michel','Thomas','2025-08-22 16:37:44','2025-08-22 16:37:44'),('5ea3e74c-181f-45a3-94a9-1409a3707869','Pocahontas','Disney','MCR','2025-10-07 09:57:03','2025-10-07 09:57:03'),('bc141ee7-0bf9-410f-a089-1900b30b391f','Run Boy Run','Woodkid','JBB','2025-08-20 14:46:05','2025-08-21 06:44:16');
/*!40000 ALTER TABLE `morceaux` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `news`
--

DROP TABLE IF EXISTS `news`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `news` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `published_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `news`
--

LOCK TABLES `news` WRITE;
/*!40000 ALTER TABLE `news` DISABLE KEYS */;
INSERT INTO `news` VALUES ('1a08a62a-8e15-4a26-9e26-3ca94005336d','TEST - LUTINS DE NOEL','fhzdeuofg efguezgf eftg uiezt fu utze ft zeu fduez tfu z','http://localhost:3001/uploads/file-1770398201263-64964504.JPG','2026-02-11 00:00:00','2026-02-06 18:16:41'),('2a646ee1-d3d6-4cf8-95d9-c388dff08777','TEST - CONCERT ANNUEL','fhuzegtuf hzoihfuzoehfuzeo oug zeuf uzeg fuze fuzegfguzegfuzeg fuuzg eufg zefguze gfuize ugf gzeu fgzeugf uzegugfuzegfuze fug zeufgezugfuzeguf zegfu zeugf uoezag fueogzfuea ufg eau fuoeafz','http://localhost:3001/uploads/file-1770391671493-783476033.jpg','2026-02-05 00:00:00','2026-02-06 16:27:52'),('2cf524d3-df70-4aad-b96e-058e53cb5d53','TEST - CONCOURS','hfuoezgf g uezgf uezoezuf tuzetgufzegfuzegfo ufuozefudoze fuodzeufdo zeuf dezu tfutzeufguzehfl zefu zeugfuz:egfukzgfuzeg fu tezu fzuetf uzet fuze ft ezutfutzeuft zeui ',NULL,'2026-02-26 00:00:00','2026-02-06 18:17:32'),('33ba22b8-4bc7-4fbe-a648-14012141ca0f','TEST - FETE DE L\'AMITIE','ghuofzgeufgzei\n\nfzhuofhzer\"gfz\n\nfzheoufhzeufgzeuifguzegfuiyzf\nfhzeuifghzeuigfiezyfhzeofhguzegfuozegfugzkf fuezogfuze fuozegtfu zft uogfuozagefu ez fuoezgfuoegfuomze fouzeufmgzeuofgzuofg ofuaezgfuoaegfuzegfu  fzefuoze mf zyf zeou fmuyzeyfymzeuogfu\n\nfhguiezgfuizegfuize ugfuzgh ','http://localhost:3001/uploads/file-1770127592471-343960110.JPG','2026-02-02 00:00:00','2026-02-03 15:06:33'),('37b549f1-0578-4990-ae46-ca3eac1456a0','TEST- FETE DE LA MUSIQUE','fgerhjkge\nge\nrgjioerhgerùgr\n\ngerjgiprzhgiorzhgzr\nr\ngzrgergergheth\ne\nhehethtreeeert\n e jyejh rkhyieorh ioerh ierh ierhierpre e e e  ','http://localhost:3001/uploads/file-1770391631675-174432884.jpg','2026-02-06 00:00:00','2026-02-06 16:27:12'),('991c9a21-0be5-48c4-9cd1-1153782e7e15','TEST - MONUMENT','fzhgergert\n\ngergerghtrzh t ujezg uzeg uezgugzuejguoze zueguoghzeuo guo omzhfumoeghurfzemghrfuoz fzehiofhzeohfoz fzef z fozhom fzeuom fzuo e\n\nfhuzeghfuzeghfu fzhfizop\nfze fgyhoizeufzef \nz z zregtrgtrezhgoujzrgfugbazufz \n hzuoihfuozeghfuitrzuirzu','http://localhost:3001/uploads/file-1770391644518-711818666.jpg','2026-02-01 00:00:00','2026-02-03 16:21:03'),('f6aab2cd-3baf-4a53-953c-f4781f98d878','TEST - DIVERS','fhuozegfuo zefueztf ueztf zeu fezutf uo yo ezouyf   fyoizeyfuoegezuomf ezuotfguezt gfuoez ftuoet ufotezuofy mouazyfuiomeyaz zof oieatyfuoet fuoze ','http://localhost:3001/uploads/file-1770398304976-499002618.jpg','2026-01-21 00:00:00','2026-02-06 18:18:25');
/*!40000 ALTER TABLE `news` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orchestra_photos`
--

DROP TABLE IF EXISTS `orchestra_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orchestra_photos` (
  `id` varchar(36) NOT NULL,
  `orchestra_id` varchar(36) NOT NULL,
  `photo_url` text NOT NULL,
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `orchestra_id` (`orchestra_id`),
  CONSTRAINT `orchestra_photos_ibfk_1` FOREIGN KEY (`orchestra_id`) REFERENCES `orchestras` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orchestra_photos`
--

LOCK TABLES `orchestra_photos` WRITE;
/*!40000 ALTER TABLE `orchestra_photos` DISABLE KEYS */;
INSERT INTO `orchestra_photos` VALUES ('321deb4b-75d0-4942-94f2-d3b4f4c964d0','e41da1e5-303f-462d-bd6e-ff0464fec5a3','http://localhost:3001/uploads/file-1769762233127-959898696.jpg',0,'2026-01-30 09:21:29'),('43f7d1cc-fdc0-11f0-bc22-5c2886b03ee3','037949b1-7b73-4b6f-b6da-c5a31d802eaf','http://localhost:3001/uploads/file-1769766266378-906731190.jpg',1,'2026-01-30 09:44:26'),('43f802e9-fdc0-11f0-bc22-5c2886b03ee3','037949b1-7b73-4b6f-b6da-c5a31d802eaf','http://localhost:3001/uploads/file-1769766266381-53676305.JPG',2,'2026-01-30 09:44:26'),('5bc6b83a-fdd3-11f0-bc22-5c2886b03ee3','f35efaa6-d788-47e9-a946-0f50ffae4127','http://localhost:3001/uploads/file-1769774466805-946852258.jpg',0,'2026-01-30 12:01:06'),('65b1fda6-fdd3-11f0-bc22-5c2886b03ee3','5135b139-1bbe-4b9b-ae81-fe23dc11536b','http://localhost:3001/uploads/file-1769774483436-48401169.jpg',0,'2026-01-30 12:01:23'),('65b21749-fdd3-11f0-bc22-5c2886b03ee3','5135b139-1bbe-4b9b-ae81-fe23dc11536b','http://localhost:3001/uploads/file-1769774483438-751500278.jpg',1,'2026-01-30 12:01:23'),('6d4c88db-fdd3-11f0-bc22-5c2886b03ee3','159574e2-b4e9-4c1f-9c78-4b5f35bbec2d','http://localhost:3001/uploads/file-1769774496201-467225924.jpg',0,'2026-01-30 12:01:36'),('6d4caaab-fdd3-11f0-bc22-5c2886b03ee3','159574e2-b4e9-4c1f-9c78-4b5f35bbec2d','http://localhost:3001/uploads/file-1769774496200-592386765.jpg',1,'2026-01-30 12:01:36'),('7e6ee6c1-aa60-41d0-aff5-2245654c38f8','0583b6b5-5de8-4c39-889b-5d6644b1ccd9','http://localhost:3001/uploads/file-1769762911869-885475507.jpg',0,'2026-01-30 09:21:29'),('8513172d-0370-11f1-bc22-5c2886b03ee3','c810fe3a-f753-49e3-a664-6a2c3d58ceb9','http://localhost:3001/uploads/file-1770391722885-850194890.jpg',0,'2026-02-06 15:28:42'),('9c8cea3c-0370-11f1-bc22-5c2886b03ee3','159574e2-b4e9-4c1f-9c78-4b5f35bbec2d','http://localhost:3001/uploads/file-1770391762225-2981194.jpg',2,'2026-02-06 15:29:22'),('cd101bfa-9e4b-403d-85ac-67163ee960f1','037949b1-7b73-4b6f-b6da-c5a31d802eaf','http://localhost:3001/uploads/file-1769763749527-729815907.JPG',0,'2026-01-30 09:21:29');
/*!40000 ALTER TABLE `orchestra_photos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orchestras`
--

DROP TABLE IF EXISTS `orchestras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orchestras`
--

LOCK TABLES `orchestras` WRITE;
/*!40000 ALTER TABLE `orchestras` DISABLE KEYS */;
INSERT INTO `orchestras` VALUES ('037949b1-7b73-4b6f-b6da-c5a31d802eaf','Orchestre d\'Harmonie','L\'Orchestre qui dévoile et étoffe la maturité musicale du musicien.\nSes interprètes sont un panel d’âges, de professions, d’études et représente un joli mélange d’amoureux de la musique.  \nCe schéma de jeunes et « moins jeunes »,  assure un bon équilibre : les plus jeunes apportent la dynamique les plus anciens sont gage de stabilité.\nSes répétitions hebdomadaires ont lieu tous les samedis de 17 h à 19 h.\nLa vie de l’Orchestre d’Harmonie est faite de projets divers et variés:\n- un récital traditionnel, fait d’œuvres spécialement écrites pour orchestres d’Harmonie, comme \"Manzara »(Jacob de Haan), « Mont Blanc » (d‘Otto M Schwartz)..., et d’arrangements divers, alliant le classique «Le Boléro»(Ravel), …, les génériques de films, «Avatar», de James Horner, la variété: Abba, Coldplay, Paris-Montmartre, etc…\n-un spectacle complet, mariant harmonieusement le théâtre, la danse, le chant….. : «La Lyre fait son cirque », « Le Portail du Temps » autant de spectacles à thèmes où interviennent les musiciens, leurs parents, amis, famille, dont les talents multiples sont ainsi mis en valeur. La Lyre reçoit alors la collaboration active d\'autres associations culturelles de Chalindrey : Théâtre, Danse,\n - l’incontournable Concert de Noël qui, chaque mois de décembre emmène des centaines d’auditeurs émerveillés dans le monde magique de Noël.…\nLa Lyre s’ouvre aussi sur d’autres univers musicaux, d’autres pratiques musicales ; la dernière expérience de ce genre est sa participation à « La Vilaine Chorale » à Montsaugeon en août dernier. \nL’Orchestre d’Harmonie se produit dans toute la Haute-Marne et dans les départements limitrophes.\nIl s’est aussi produit à l’étranger : le plus magique étant la Chine en 2004, le plus exotique : La Réunion en 2018.\n','2025-08-14 12:52:58','http://localhost:3001/uploads/file-1769763749527-729815907.JPG',0),('0583b6b5-5de8-4c39-889b-5d6644b1ccd9','New Retro','Le plus sollicité des ensembles ponctuels est le New Retro. Constitué de « vents de percussions légères et d’une contrebasse à cordes électrique», c’est l’ensemble le plus facile à déplacer.\n\nLe New Retro n’a donc aucunes exigences techniques : prises électriques, sonorisations…, sont inutiles. S’adaptant aux lieux et aux circonstances, il peut « se poser dans un coin » et enchaîner ses mélodies.\n\nSon répertoire populaire et festif est l’autre argument de son succès : airs des années 1980, 1960, musiques pop-rock, rock-en roll, , musette, variétés françaises…\nSes répétitions ont lieu en fonction du calendrier des prestations, ainsi donc, les musiciens prétendant intégrer le New Rétro doivent posséder une aisance au déchiffrage.','2025-08-14 12:52:58','http://localhost:3001/uploads/file-1769762911869-885475507.jpg',4),('159574e2-b4e9-4c1f-9c78-4b5f35bbec2d','Orchestres Ephémères','Au fils des années et des manifestations, La Lyre s\'est dotée de plusieurs ensembles « mobiles ».\n\nEn effet, La Lyre a cette capacité de s’adapter aux demandes particulières, et de créer des groupes « sur mesure ». C’est ainsi que se sont constitués : un Ensemble Style Renaissance, un Ensemble Musique de Kiosque, « Les Lutins de Noël », le « Groupe 14-18 et un ensemble possédant les compétence de se joindre aux musiques actuelles \n\nLeurs répertoires sont établis et adaptés en fonction des manifestations auxquelles ces orchestres participeront : inaugurations, mariages, anniversaires, assemblées générales, animations en tous genres...','2026-01-30 09:33:33','http://localhost:3001/uploads/file-1769774496201-467225924.jpg',6),('5135b139-1bbe-4b9b-ae81-fe23dc11536b','Orchestre Grimoire','L’ensemble qui accueille « les déjà initiés » ayant  3 à 4 ans de pratique instrumentale.\n\nLe répertoire y approfondit les apprentissages des cours de formations musicale, en mettant l’accent sur les rythmes qui se complexifient et le déchiffrage.\nCet orchestre tend à ancrer plus fortement les automatismes créés dans l’orchestre Chaudron et à raccourcir le temps de réaction à l’exécution d’une œuvre.\n\n« Aztec Sunrise » de John Edmondson, ou encore  “Can you feel the love tonight” (Le roi lion) de Elton John sont à son répertoire\n\nComme l’orchestre Chaudron, « Grimoire »  se produit en concert deux à trois fois par an, aux mêmes occasions\nLes répétitions ont lieu le mercredi de 15h à 16h\n','2025-08-14 12:52:58','http://localhost:3001/uploads/file-1769774483436-48401169.jpg',2),('c810fe3a-f753-49e3-a664-6a2c3d58ceb9','Batucada','Initiée par Marie-Christine Rémongin, la Batucada est un ensemble de percussions qui répète tous les premiers lundis de chaque mois.\n\nLa pratique de la Batucada est ouverte à tous et ne nécessite aucune connaissance musicale particulière, Chaque instrument y joue un rythme propre et lui apporte sa couleur musicale : Le plus souvent, on y retrouve la samba et donc les ambiances rythmées du carnaval de Rio !\nIl anime carnavals, défilés festifs, etc…\n','2026-01-30 09:32:39','http://localhost:3001/uploads/file-1770391722885-850194890.jpg',5),('e41da1e5-303f-462d-bd6e-ff0464fec5a3','Orchestre Sortilèges','Cet orchestre perfectionne les acquis de l\'orchestre Grimoire. On accuse au minimum 4 années de pratique instrumentale pour accéder aux rangs de  Sortilèges.\nIl est le tremplin à l’accession aux rangs de l’Orchestre d’Harmonie; quelques grands déjà au sein du Grand Orchestre \"cumulent\" en raison du plaisir de jouer ensemble.\n\nLes répétitions ont lieu le mercredi, de 17 h 30 à 19 h. Jeunes, ado et adultes travaillent des morceaux qui demandent une capacité de concentration et d\'écoute plus développée et exigent plus de compétences techniques. La difficulté du répertoire de cette formation approche progressivement celle des partitions du Grand Orchestre.\n\nCette formation se produit avec les autres orchestres d\'élèves, mais a également l\'occasion de se mêler aux musiciens de l\'Harmonie, histoire de ...\"tâter le terrain\"!\n\nC\'est le cas pour les défilés des 08 mai et 11 novembre.\n« Accidentaly in love »(Shreck) de Adam F. Duritz et “Don\'t Cry for me Argentina” de Andrew LLoyd Webber, (Evita) ; “Abba on Broadway”, “House of the Rising Sun” (Le pénitencier) arrangé par Donald Furlano; Paris Montmartre, “Pocahontas » de Alan Menken - Arrangé par Michael Sweeney,…, sont à son programme cette année.\n','2025-08-14 12:52:58','http://localhost:3001/uploads/file-1769762233127-959898696.jpg',3),('f35efaa6-d788-47e9-a946-0f50ffae4127','Orchestre Chaudron','L’ensemble qui conforte en douceur, les premières notions apprises à l\'Ecole de Musique de La Lyre et de découvrir le travail en ensemble.\n\nEnfants et adultes du premier cycle d’apprentissage (2 premières années), se retrouvent pour mettre au point des pièces adaptées à leur niveau.\n\nChaudron se produit en concert deux à trois fois dans l’année, pour la Fête de la Musique, l’Estival de La Lyre…\nLes néophytes travaillent des œuvres composées pour orchestres débutants, mais aussi des arrangements de Beethoven (L’Hymne à la joie)…, ou contemporaines: …. Hans Zimmer, Alan Menken…\n\nLes répétions de cette classe orchestrale ont lieu le mercredi de 11 h à midi.','2025-08-14 12:52:58','http://localhost:3001/uploads/file-1769774466805-946852258.jpg',1);
/*!40000 ALTER TABLE `orchestras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `page_headers`
--

DROP TABLE IF EXISTS `page_headers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `page_headers` (
  `page_slug` varchar(50) NOT NULL,
  `image_url` text,
  `page_title` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`page_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `page_headers`
--

LOCK TABLES `page_headers` WRITE;
/*!40000 ALTER TABLE `page_headers` DISABLE KEYS */;
INSERT INTO `page_headers` VALUES ('contact','http://localhost:3001/uploads/file-1769675425806-105824522.JPG','Contactez-nous  Une question ? Envie de nous rejoindre ? Nous sommes là pour vous accompagner.','2026-01-29 09:23:03'),('events','http://localhost:3001/uploads/file-1769760613489-718076703.JPG','','2026-01-30 08:10:33'),('media','http://localhost:3001/uploads/file-1769675413152-372272526.JPG','','2026-01-29 09:23:03'),('orchestres','http://localhost:3001/uploads/file-1769761212865-637469169.JPG',NULL,'2026-01-30 08:20:19'),('school','http://localhost:3001/uploads/file-1770036904563-907751801.JPG','','2026-02-02 12:55:10');
/*!40000 ALTER TABLE `page_headers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partitions`
--

DROP TABLE IF EXISTS `partitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partitions`
--

LOCK TABLES `partitions` WRITE;
/*!40000 ALTER TABLE `partitions` DISABLE KEYS */;
INSERT INTO `partitions` VALUES ('1678cb4a-8494-4e14-8177-d8abe6e37ad6','Trompette 1','435bd944-7d25-4206-b0f8-a51bbf5566a4','08dbfcf9-1376-4f75-a704-9bb84bef09ad','http://localhost:3001/uploads/file-1761648678186-90503884.jpg','Trompette 1.jpg','image',8200,'2025-10-28 11:51:18','2025-10-28 11:51:18');
/*!40000 ALTER TABLE `partitions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partners`
--

DROP TABLE IF EXISTS `partners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `partners` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `logo_url` text,
  `description` text,
  `website_url` text,
  `display_order` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partners`
--

LOCK TABLES `partners` WRITE;
/*!40000 ALTER TABLE `partners` DISABLE KEYS */;
INSERT INTO `partners` VALUES ('04ac46e5-c454-45ba-98f1-71df60ae702d','Férération Musicale Aube-Haute Marne','http://localhost:3001/uploads/file-1770394732349-677751711.avif',NULL,NULL,10,'2026-02-06 17:18:52'),('1be58b58-3d89-4e52-be19-4e8b955cead8','Garage Huguenot','http://localhost:3001/uploads/file-1770394757143-337791951.avif',NULL,NULL,11,'2026-02-06 17:19:17'),('3747b24c-a568-44a0-b376-04be21a49453','Caro Optique','http://localhost:3001/uploads/file-1770394496373-709785504.avif',NULL,NULL,7,'2026-02-06 17:14:56'),('37b1e584-b8b4-480c-a5df-6e4534f6fab3','Menuiserie Foultot','http://localhost:3001/uploads/file-1770394896979-191325514.avif',NULL,NULL,16,'2026-02-06 17:21:36'),('46555964-23f7-4476-bfd1-173973041792','Cadences','http://localhost:3001/uploads/file-1769866372264-12591342.avif',NULL,'https://www.cadencesmusic.com/',3,'2026-01-31 14:32:52'),('4706ff40-4624-41f6-b48c-faf170568782','JHM','http://localhost:3001/uploads/file-1770394823484-1653891.avif',NULL,NULL,13,'2026-02-06 17:20:23'),('4c84b32c-da76-4b86-852f-4ee9fdbbd155','ICI France 3','http://localhost:3001/uploads/file-1770394777522-622331666.avif',NULL,NULL,12,'2026-02-06 17:19:37'),('50ae7c84-5367-4c67-b3fd-f48279903e1e','Ville de Chalindrey','https://res.cloudinary.com/dr2sbjrms/image/upload/v1773173597/lyre-uploads/joa87t21k1t8r5kv7dzq.avif',NULL,'https://www.ville-chalindrey.fr/fr/',0,'2026-01-31 14:24:53'),('55c81aec-a1b0-4bc8-9f49-f89d4b771771','Ludovic Bailly','http://localhost:3001/uploads/file-1770394870992-976958102.avif',NULL,NULL,15,'2026-02-06 17:21:11'),('622b5713-7795-4df4-9a3c-3c714335579e','Carrosserie Boulangier','http://localhost:3001/uploads/file-1770037762919-917462576.avif',NULL,'https://www.carrosserie-boulangier.fr/',6,'2026-02-02 14:09:22'),('6dc19cb9-9999-4b59-853b-8b088b341242','Citroën Chalindrey','http://localhost:3001/uploads/file-1769866439354-200797069.avif',NULL,'https://reseau.citroen.fr/reparateur-chalindrey/?location=CHALINDREY%7C0',5,'2026-01-31 14:33:59'),('84679a14-313c-4e9c-9c70-1740d44d8118','Communauté de Communes des Savoir-Faire','http://localhost:3001/uploads/file-1770394622525-479193345.avif',NULL,NULL,8,'2026-02-06 17:17:02'),('86db628b-64f1-40eb-9285-57935a1a017f','L\'Essentiel Coiffure','http://localhost:3001/uploads/file-1770394844922-467660688.avif',NULL,NULL,14,'2026-02-06 17:20:44'),('8b6321d7-70b7-4e2d-bcf0-14a179f223eb','Département Haute Marne','http://localhost:3001/uploads/file-1769866490161-153171312.avif',NULL,'https://haute-marne.fr/',1,'2026-01-31 14:34:50'),('9b503176-21f9-4def-81e5-eba43866cb73','Region Grand Est','http://localhost:3001/uploads/file-1770394924863-421379522.avif',NULL,NULL,17,'2026-02-06 17:22:04'),('becca3d9-d7d7-4304-b870-f38f2ee1167e','Dominique Drut - Ramonage','http://localhost:3001/uploads/file-1770394679147-476353254.avif',NULL,NULL,9,'2026-02-06 17:17:59'),('d8efa5ae-afbc-4dbf-9225-7824b8048d6b','Arts Vivants 52','http://localhost:3001/uploads/file-1770037555585-895149605.png',NULL,'https://www.artsvivants52.org/',2,'2026-02-02 14:05:55'),('e69c7f4d-3cee-4149-876a-57ab99986734','Idelik','http://localhost:3001/uploads/file-1769866340918-837596679.avif',NULL,'https://www.idelik.fr/',4,'2026-01-31 14:32:20'),('ec2d7f24-8fe5-42a4-9acc-7fd5e812e46d','UAICF','http://localhost:3001/uploads/file-1770394940804-724483238.avif',NULL,NULL,18,'2026-02-06 17:22:20');
/*!40000 ALTER TABLE `partners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profiles`
--

DROP TABLE IF EXISTS `profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profiles` (
  `id` varchar(36) NOT NULL,
  `first_name` text,
  `last_name` text,
  `role` enum('Membre','Admin','Professeur','Gestionnaire') DEFAULT 'Membre',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `profiles_id_fkey` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profiles`
--

LOCK TABLES `profiles` WRITE;
/*!40000 ALTER TABLE `profiles` DISABLE KEYS */;
INSERT INTO `profiles` VALUES ('29cbd663-433a-45a7-9d30-85e4e4d8dd60','Admin','Test','Admin','2025-08-14 09:41:49'),('31083b3c-0f52-483b-b7bb-9e84fabefa20','Thomas','Cellier','Membre','2025-08-14 12:55:16'),('5381ca7f-b0dc-4698-99b3-08b604b85365','Blaise','BAILLY','Membre','2025-10-15 09:03:11'),('5441a960-ccd4-4d31-88dd-3eb0523b877d','Gregory','Durand','Membre','2025-08-14 12:58:49'),('627ffbb4-74f5-446f-b7c1-9d0da2c4daf7','Mathilde','Lesserteur','Membre','2025-08-14 13:01:03'),('674fa720-f3fc-4d6b-9f89-118fe0cf741a','Marie-Christine','Remongin','Admin','2025-08-21 07:18:08'),('75f9975a-97a2-4c14-aff3-d5d0e83ac794','Michel','Gérard','Membre','2025-08-22 16:24:21'),('83f91cc3-8aa4-47bd-8de0-fa72bf9590fa','Christine','Cellier','Membre','2025-08-14 12:43:53'),('a8421288-e5e0-4911-8ae7-def9c8eecb9f','Gestionnaire','Test','Gestionnaire','2025-08-14 11:39:49'),('ae1ba663-2a51-4376-a9b3-0a13686243be','Alexandra','FOURNIER','Membre','2025-10-27 10:16:24'),('f46db143-07fe-4ea0-b6f2-36e5d637a3f9','Dominique','Couturier','Membre','2025-10-08 17:40:33');
/*!40000 ALTER TABLE `profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_settings`
--

DROP TABLE IF EXISTS `site_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_settings`
--

LOCK TABLES `site_settings` WRITE;
/*!40000 ALTER TABLE `site_settings` DISABLE KEYS */;
INSERT INTO `site_settings` VALUES ('carousel_interval','10000','2026-01-29 07:58:52'),('site_logo_url','http://localhost:3001/uploads/file-1769530670320-312137159.png','2026-01-27 16:17:52'),('theme_primary_color','#0D9488','2026-01-31 15:35:43'),('theme_secondary_color','#1E293B','2026-01-27 16:19:49');
/*!40000 ALTER TABLE `site_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_instruments`
--

DROP TABLE IF EXISTS `user_instruments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_instruments`
--

LOCK TABLES `user_instruments` WRITE;
/*!40000 ALTER TABLE `user_instruments` DISABLE KEYS */;
INSERT INTO `user_instruments` VALUES ('1102e172-892c-4361-91b6-a62378b6a21d','674fa720-f3fc-4d6b-9f89-118fe0cf741a','6335920b-8123-43c4-8a15-546431c9d003','2025-08-21 07:18:08'),('129ed9b5-6fc6-4cc3-8e12-a0f8130dde5d','5441a960-ccd4-4d31-88dd-3eb0523b877d','08dbfcf9-1376-4f75-a704-9bb84bef09ad','2025-08-14 12:58:50'),('39c686c8-f242-4252-bd2d-a04c30b83980','674fa720-f3fc-4d6b-9f89-118fe0cf741a','18942156-0d3b-4b02-a150-39e672e54132','2025-08-21 07:18:08'),('3e448854-4471-42d5-8266-9a0f1d38bb9f','ae1ba663-2a51-4376-a9b3-0a13686243be','664b0408-8211-4b06-bc3f-575ea4af6010','2025-10-27 10:16:24'),('4084149f-c98a-40a5-8d36-0c2b8c116bea','75f9975a-97a2-4c14-aff3-d5d0e83ac794','c4047c73-0334-4270-8fd5-8b942ad75e32','2025-08-22 16:24:22'),('42701676-6f97-4843-b136-42f5f9858c0f','674fa720-f3fc-4d6b-9f89-118fe0cf741a','d5b875f9-5336-4a4b-a345-31ed7ad4fcf9','2025-08-21 07:18:08'),('5f2dc078-1001-45f9-b0b1-fe75f196b69c','674fa720-f3fc-4d6b-9f89-118fe0cf741a','c4047c73-0334-4270-8fd5-8b942ad75e32','2025-08-21 07:18:08'),('7228ece9-784a-4ce6-b0e5-1e4b93a0baf7','31083b3c-0f52-483b-b7bb-9e84fabefa20','d5b875f9-5336-4a4b-a345-31ed7ad4fcf9','2025-08-14 12:55:17'),('7f7580c2-1db3-44ef-a663-a3fe600ce3f7','674fa720-f3fc-4d6b-9f89-118fe0cf741a','9bae819e-7f71-43ed-8099-a4db23a9210e','2025-08-21 07:18:08'),('90545508-3423-4d80-8f68-b41236e5c866','627ffbb4-74f5-446f-b7c1-9d0da2c4daf7','d5b875f9-5336-4a4b-a345-31ed7ad4fcf9','2025-08-22 17:22:14'),('90b44d6e-aebe-4a50-9b84-58e775cfe8dd','674fa720-f3fc-4d6b-9f89-118fe0cf741a','0e690bdd-338a-4e51-8a63-904a5dae6c44','2025-08-21 07:18:08'),('989ad472-5121-4fc0-9c5a-b2ce8ec44097','674fa720-f3fc-4d6b-9f89-118fe0cf741a','8bbb72e2-df87-4ccb-b43d-9f86cbc2e95b','2025-08-21 07:18:08'),('bd13cd38-cd6d-44d6-aece-456bee4ae019','674fa720-f3fc-4d6b-9f89-118fe0cf741a','664b0408-8211-4b06-bc3f-575ea4af6010','2025-08-21 07:18:08'),('bf3965c2-91ab-41d1-b4a7-697f190951c1','f46db143-07fe-4ea0-b6f2-36e5d637a3f9','6335920b-8123-43c4-8a15-546431c9d003','2025-10-08 17:40:34'),('c33285f4-6944-40fe-b138-aad5e89ee8ab','674fa720-f3fc-4d6b-9f89-118fe0cf741a','912f26da-bfc9-46f1-ae91-0a26c354da2d','2025-08-21 07:18:08'),('cae071e8-eb10-426b-b5be-ea60784b2b6f','5381ca7f-b0dc-4698-99b3-08b604b85365','6335920b-8123-43c4-8a15-546431c9d003','2025-10-15 09:03:12'),('dd884d51-8dc6-4a1d-b637-c3f97d069654','674fa720-f3fc-4d6b-9f89-118fe0cf741a','1ab168aa-9848-4f45-b423-9c46c64c174d','2025-08-21 07:18:08'),('e792eb46-7bf9-4959-91a3-aa6c824279a9','674fa720-f3fc-4d6b-9f89-118fe0cf741a','08dbfcf9-1376-4f75-a704-9bb84bef09ad','2025-08-21 07:18:08'),('f198ca64-3cdc-410a-8c2c-46ec909a4749','83f91cc3-8aa4-47bd-8de0-fa72bf9590fa','08dbfcf9-1376-4f75-a704-9bb84bef09ad','2025-08-14 12:53:36');
/*!40000 ALTER TABLE `user_instruments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_orchestras`
--

DROP TABLE IF EXISTS `user_orchestras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_orchestras`
--

LOCK TABLES `user_orchestras` WRITE;
/*!40000 ALTER TABLE `user_orchestras` DISABLE KEYS */;
INSERT INTO `user_orchestras` VALUES ('0af04292-f62b-42ac-9121-e9cc8045f84e','83f91cc3-8aa4-47bd-8de0-fa72bf9590fa','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2025-08-14 12:53:39'),('0c1b2c78-913b-4d00-82a3-6845c685f17d','627ffbb4-74f5-446f-b7c1-9d0da2c4daf7','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2025-08-22 17:22:15'),('250b5051-9b9d-4743-87f2-379aa88c89d3','674fa720-f3fc-4d6b-9f89-118fe0cf741a','e41da1e5-303f-462d-bd6e-ff0464fec5a3','2025-08-21 07:18:09'),('3dc19d0e-de81-4049-aae3-925a8abab3ff','f46db143-07fe-4ea0-b6f2-36e5d637a3f9','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2025-10-08 17:40:35'),('42974901-aa79-4dfb-a0f4-226e913fd796','5381ca7f-b0dc-4698-99b3-08b604b85365','0583b6b5-5de8-4c39-889b-5d6644b1ccd9','2025-10-15 09:03:13'),('45e8c36c-9ce9-4a42-9305-0bb54d697288','ae1ba663-2a51-4376-a9b3-0a13686243be','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2025-10-27 10:16:24'),('493f6f7b-b8fa-41fc-8358-775069325574','674fa720-f3fc-4d6b-9f89-118fe0cf741a','5135b139-1bbe-4b9b-ae81-fe23dc11536b','2025-08-21 07:18:09'),('5540afaf-a286-47e0-99be-6377a30f1795','5381ca7f-b0dc-4698-99b3-08b604b85365','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2025-10-15 09:03:13'),('57acd484-ec10-45ab-afcc-a4c5c117116d','75f9975a-97a2-4c14-aff3-d5d0e83ac794','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2025-08-22 16:24:23'),('5eddcdc7-e3c0-445c-b03b-1b2596a467f1','674fa720-f3fc-4d6b-9f89-118fe0cf741a','0583b6b5-5de8-4c39-889b-5d6644b1ccd9','2025-08-21 07:18:09'),('6abf4605-07aa-4484-b226-47cb8056588b','75f9975a-97a2-4c14-aff3-d5d0e83ac794','0583b6b5-5de8-4c39-889b-5d6644b1ccd9','2025-08-22 16:24:23'),('74154cb1-5249-4f25-ada8-3634707488f0','674fa720-f3fc-4d6b-9f89-118fe0cf741a','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2025-08-21 07:18:09'),('74d06b6d-963e-40f1-bb99-99f1d0c51198','674fa720-f3fc-4d6b-9f89-118fe0cf741a','f35efaa6-d788-47e9-a946-0f50ffae4127','2025-08-21 07:18:09'),('7898fd19-a750-497e-ba69-3b48d5bdcde7','627ffbb4-74f5-446f-b7c1-9d0da2c4daf7','0583b6b5-5de8-4c39-889b-5d6644b1ccd9','2025-08-22 17:22:15'),('97ef69e7-1bed-47c8-87f3-8785b824c8d4','f46db143-07fe-4ea0-b6f2-36e5d637a3f9','0583b6b5-5de8-4c39-889b-5d6644b1ccd9','2025-10-08 17:40:35'),('ab8ebff8-f606-43e3-a516-2747a3ae9cf9','31083b3c-0f52-483b-b7bb-9e84fabefa20','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2025-08-14 12:55:17'),('d0be854b-22f4-4a8e-8c31-adb169ff254a','83f91cc3-8aa4-47bd-8de0-fa72bf9590fa','0583b6b5-5de8-4c39-889b-5d6644b1ccd9','2025-08-14 12:53:39'),('e30d9ba0-757f-4fda-b9f5-fb51f0429a21','f46db143-07fe-4ea0-b6f2-36e5d637a3f9','e41da1e5-303f-462d-bd6e-ff0464fec5a3','2025-10-08 17:40:35'),('eb7cbf2b-be5a-4244-b86e-eef28f07325c','5441a960-ccd4-4d31-88dd-3eb0523b877d','037949b1-7b73-4b6f-b6da-c5a31d802eaf','2025-08-14 12:58:51');
/*!40000 ALTER TABLE `user_orchestras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('29cbd663-433a-45a7-9d30-85e4e4d8dd60','admin@lyre.fr','$2a$10$z91MrNUOEi5S4m7.cVZ4t.RC/Br4c4dJpj1IOVyHN067lCw0Y2ixy','2025-08-14 09:40:35'),('31083b3c-0f52-483b-b7bb-9e84fabefa20','thomas@lyre.fr','$2a$10$NkFlokbDwC7lhFs2KcPMFOd1glbJXO5T3AcRt3LDXmuLQHiFInOAy','2025-08-14 12:55:16'),('5381ca7f-b0dc-4698-99b3-08b604b85365','blaise@lyre.fr','$2a$10$Blf8YoCptH.WU/OLGyTNDe4VDJxn8K9.nE85graEJxOIaWVI6XRb2','2025-10-15 09:03:11'),('5441a960-ccd4-4d31-88dd-3eb0523b877d','gregory@lyre.fr','$2a$10$J80xfmXT9bCiuekvWCCOdeQF4DmKk2EOnnZ4gnV7oZBrvh6JLEcuy','2025-08-14 12:58:49'),('627ffbb4-74f5-446f-b7c1-9d0da2c4daf7','mathilde@lyre.fr','$2a$10$VimRzJoCcFE8z9ixQkKquOo.HKzg4YvcBi2Gc8aLLSVBf10uixARm','2025-08-14 13:01:03'),('674fa720-f3fc-4d6b-9f89-118fe0cf741a','mcr@lyre.fr','$2a$10$rbn9Jk6hGtnawfR/BG5drO4wGpDswyfRHpCEMNOfIFrhowZHYlmi.','2025-08-21 07:18:08'),('75f9975a-97a2-4c14-aff3-d5d0e83ac794','michel@lyre.fr','$2a$10$feVoDgQ6sRkpJKOjIdQtAO7MxFn2.NbmRqO38m6LpXftoj/jH95ZW','2025-08-22 16:24:21'),('83f91cc3-8aa4-47bd-8de0-fa72bf9590fa','christine@lyre.fr','$2a$10$5PMQJrgdZ2OLsN2NB4Sp.e6kh9q1t8JkP9hDaMRpUuYFABmcFxCsK','2025-08-14 12:43:53'),('a8421288-e5e0-4911-8ae7-def9c8eecb9f','gestionnaire@lyre.fr','$2a$10$cfgGCXQU8HvIsr4mdVat.OaaxVuiWYJ0gKsDKMz3he9w/D6Of18wW','2025-08-14 11:39:49'),('ae1ba663-2a51-4376-a9b3-0a13686243be','alexandra@lyre.fr','$2b$10$b6z3yrvzRECLrREGxURua.r.x6gymDXAIqdXKx8JJl9DFM3KJoxpq','2025-10-27 10:16:24'),('f46db143-07fe-4ea0-b6f2-36e5d637a3f9','dominique@lyre.fr','$2a$10$TCsC8w3C7/c98/aAEUBe1upnW3KpM0aT6oRwnV7iSB0yD2igZauwS','2025-10-08 17:40:33');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-16 11:04:06
