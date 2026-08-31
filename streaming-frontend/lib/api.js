// Client API centralisé - toutes les requêtes vers notre backend passent par ici

import * as tus from 'tus-js-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function clearToken() {
  localStorage.removeItem('token');
}

async function request(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Une erreur est survenue.' }));
    throw new Error(error.error || 'Une erreur est survenue.');
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  signup: (data) => request('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  getCatalog: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/catalog${query ? `?${query}` : ''}`);
  },
  getContent: (id) => request(`/api/catalog/${id}`),

  getContinueWatching: (profileId) => request(`/api/watch/continue-watching/${profileId}`),
  updateProgress: (data) => request('/api/watch/progress', { method: 'POST', body: JSON.stringify(data) }),

  getMyList: (profileId) => request(`/api/watch/my-list/${profileId}`),
  addToMyList: (data) => request('/api/watch/my-list', { method: 'POST', body: JSON.stringify(data) }),
  removeFromMyList: (data) => request('/api/watch/my-list', { method: 'DELETE', body: JSON.stringify(data) }),

  createCheckoutSession: (priceId) =>
    request('/api/subscriptions/checkout', { method: 'POST', body: JSON.stringify({ priceId }) }),

  // --- Admin : gestion du catalogue ---
  getUploadUrl: (fileName, fileSize) =>
    request('/api/catalog/upload-url', { method: 'POST', body: JSON.stringify({ fileName, fileSize }) }),
  createMovie: (data) => request('/api/catalog/movies', { method: 'POST', body: JSON.stringify(data) }),
  createSeries: (data) => request('/api/catalog/series', { method: 'POST', body: JSON.stringify(data) }),
  createEpisode: (data) => request('/api/catalog/episodes', { method: 'POST', body: JSON.stringify(data) }),
};

/**
 * Upload direct du fichier vidéo vers Cloudflare Stream via le protocole TUS
 * (upload par morceaux). Contrairement à un upload classique, celui-ci peut
 * REPRENDRE automatiquement là où il s'est arrêté en cas de coupure réseau —
 * essentiel pour des fichiers de plusieurs Go.
 * onProgress reçoit un pourcentage (0-100).
 */
export function uploadVideoFile(uploadUrl, file, onProgress) {
  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      uploadUrl, // session déjà créée côté backend, on l'utilise directement
      chunkSize: 50 * 1024 * 1024, // 50 Mo par morceau
      retryDelays: [0, 3000, 5000, 10000, 20000], // réessaie automatiquement en cas de coupure
      metadata: { filename: file.name, filetype: file.type },
      onError: (error) => reject(error),
      onProgress: (bytesUploaded, bytesTotal) => {
        if (onProgress) onProgress(Math.round((bytesUploaded / bytesTotal) * 100));
      },
      onSuccess: () => resolve(),
    });

    upload.start();
  });
}

export { getToken, setToken, clearToken };
