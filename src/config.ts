const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
// Defensive fix: strip trailing /api if present to prevent /api/api/chat errors
export const API_BASE_URL = rawUrl.replace(/\/api\/?$/, '');
