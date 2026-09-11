import pool from '../db';

export async function initDatabaseTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_attendances (
        id VARCHAR(36) PRIMARY KEY,
        event_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        status ENUM('present', 'absent') NOT NULL,
        comment VARCHAR(255) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_event_user (event_id, user_id),
        INDEX idx_event_id (event_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[Database] event_attendances table verified/created.');
  } catch (error: any) {
    console.error('[Database Init Error]', error.message);
  }
}
