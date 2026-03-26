import pool from '../db';
import crypto from 'crypto';

export type ActivityType = 'event' | 'partition' | 'news';
export type ActionType = 'create' | 'update' | 'delete';

interface LogActivityParams {
    type: ActivityType;
    action_type: ActionType;
    target_id: string;
    orchestra_id?: string | null;
    created_by: string;
    title: string;
    message: string;
}

/**
 * Enregistre une activité dans le journal pour le flux du dashboard.
 */
export const logActivity = async (params: LogActivityParams) => {
    const { type, action_type, target_id, orchestra_id, created_by, title, message } = params;
    
    try {
        await pool.query(
            'INSERT INTO activity_log (id, type, action_type, target_id, orchestra_id, created_by, title, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [crypto.randomUUID(), type, action_type, target_id, orchestra_id || null, created_by, title, message]
        );
        
        // Notification temps réel via SSE
        import('./sse').then(sse => sse.broadcastUpdate());
    } catch (error) {
        console.error('Failed to log activity:', error);
        // On ne bloque pas l'action principale si le log échoue
    }
};
