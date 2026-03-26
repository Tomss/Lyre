import { Response } from 'express';

let clients: Response[] = [];

/**
 * Ajoute un client à la liste des flux SSE actifs.
 */
export const addSseClient = (res: Response) => {
    clients.push(res);
    
    // Nettoyage lors de la déconnexion
    res.on('close', () => {
        clients = clients.filter(c => c !== res);
    });
};

/**
 * Envoie un signal de mise à jour à tous les clients connectés.
 */
export const broadcastUpdate = () => {
    clients.forEach(client => {
        try {
            client.write(`data: update\n\n`);
        } catch (err) {
            console.error('SSE Broadcast error:', err);
        }
    });
};
