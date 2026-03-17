-- Script de migration pour transformer les URLs localhost en chemins relatifs
-- À exécuter sur la base de données Railway (MySQL)

-- Table News
UPDATE news 
SET image_url = REPLACE(image_url, 'http://localhost:3001', '')
WHERE image_url LIKE 'http://localhost:3001%';

-- Table Carousel (si le nom est correct)
UPDATE carousel_images
SET url = REPLACE(url, 'http://localhost:3001', '')
WHERE url LIKE 'http://localhost:3001%';

-- Table Partners
UPDATE partners
SET logo_url = REPLACE(logo_url, 'http://localhost:3001', '')
WHERE logo_url LIKE 'http://localhost:3001%';

-- Table Orchestras
UPDATE orchestras
SET image_url = REPLACE(image_url, 'http://localhost:3001', '')
WHERE image_url LIKE 'http://localhost:3001%';

-- Table Instruments
UPDATE instruments
SET image_url = REPLACE(image_url, 'http://localhost:3001', '')
WHERE image_url LIKE 'http://localhost:3001%';

-- Table Settings (logos)
UPDATE settings
SET value = REPLACE(value, 'http://localhost:3001', '')
WHERE setting_key IN ('site_logo', 'header_logo') 
AND value LIKE 'http://localhost:3001%';
