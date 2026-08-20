export const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

export const API_URL = `${BASE_URL}/api`;

// Si jamais tu gères des images stockées sur le serveur
export const UPLOADS_URL = `${BASE_URL}/uploads`;