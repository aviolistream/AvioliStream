// Service d'intégration avec Cloudflare Stream
// Documentation officielle : https://developers.cloudflare.com/stream/

const axios = require('axios');

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream`;

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${API_TOKEN}`,
  },
});

/**
 * Étape 1 : demander à Cloudflare une URL d'upload direct.
 * Le fichier vidéo est ensuite envoyé DIRECTEMENT depuis le navigateur/l'admin
 * vers Cloudflare (pas besoin de faire transiter le fichier par notre serveur,
 * ce qui évite les problèmes de taille de fichier et de timeout).
 *
 * maxDurationSeconds : durée max autorisée pour la vidéo uploadée
 */
async function createDirectUploadUrl({ maxDurationSeconds = 21600 } = {}) {
  const response = await client.post('/direct_upload', {
    maxDurationSeconds,
    requireSignedURLs: false, // passer à true plus tard pour restreindre l'accès (DRM basique)
  });

  return {
    uploadUrl: response.data.result.uploadURL,
    videoId: response.data.result.uid,
  };
}

/**
 * Crée une session d'upload TUS (upload par morceaux, avec reprise automatique
 * en cas de coupure réseau). À utiliser pour tout fichier de plus de ~200 Mo,
 * donc quasiment tous les films/épisodes en qualité correcte.
 * Supporte des fichiers jusqu'à 30 Go.
 *
 * fileName : nom du fichier (juste pour le retrouver dans le dashboard Cloudflare)
 * fileSize : taille du fichier en octets (obligatoire pour TUS)
 */
async function createTusUpload({ fileName, fileSize, maxDurationSeconds = 21600 }) {
  if (!fileSize) {
    throw new Error('fileSize est requis pour créer un upload TUS.');
  }

  const metadataParts = [
    `name ${Buffer.from(fileName || 'video').toString('base64')}`,
    `maxDurationSeconds ${Buffer.from(String(maxDurationSeconds)).toString('base64')}`,
    `allowedorigins ${Buffer.from('*').toString('base64')}`,
  ];

  const response = await axios.post(`${BASE_URL}?direct_user=true`, null, {
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Tus-Resumable': '1.0.0',
      'Upload-Length': String(fileSize),
      'Upload-Metadata': metadataParts.join(','),
    },
  });

  return {
    uploadUrl: response.headers['location'],
    videoId: response.headers['stream-media-id'],
  };
}

/**
 * Récupérer le statut et les infos d'une vidéo (utile pour savoir si
 * l'encodage est terminé et si elle est prête à être diffusée).
 */
async function getVideoDetails(videoId) {
  const response = await client.get(`/${videoId}`);
  return response.data.result;
}

/**
 * Supprimer une vidéo de Cloudflare Stream (ex: si on retire un film du catalogue).
 */
async function deleteVideo(videoId) {
  await client.delete(`/${videoId}`);
}

/**
 * Construit l'URL de lecture HLS (streaming adaptatif) à donner au lecteur vidéo
 * côté frontend.
 */
function getPlaybackUrl(videoId) {
  return `https://videodelivery.net/${videoId}/manifest/video.m3u8`;
}

/**
 * Construit l'URL de la miniature auto-générée par Cloudflare.
 */
function getThumbnailUrl(videoId) {
  return `https://videodelivery.net/${videoId}/thumbnails/thumbnail.jpg`;
}

module.exports = {
  createDirectUploadUrl,
  createTusUpload,
  getVideoDetails,
  deleteVideo,
  getPlaybackUrl,
  getThumbnailUrl,
};
