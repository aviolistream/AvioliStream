'use client';

import { useState } from 'react';
import { api, uploadVideoFile } from '../lib/api';

/**
 * Gère tout le flux d'upload vidéo :
 * 1. Demande une URL d'upload au backend (qui la demande à Cloudflare Stream)
 * 2. Envoie le fichier DIRECTEMENT à Cloudflare (pas via notre serveur)
 * 3. Renvoie le videoId au composant parent une fois terminé
 */
export default function VideoUploadField({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | uploading | done | error
  const [error, setError] = useState('');
  const [videoId, setVideoId] = useState(null);

  async function handleUpload() {
    if (!file) return;
    setStatus('uploading');
    setError('');

    try {
      const { uploadUrl, videoId: newVideoId } = await api.getUploadUrl(file.name, file.size);
      await uploadVideoFile(uploadUrl, file, setProgress);
      setVideoId(newVideoId);
      setStatus('done');
      onUploaded(newVideoId);
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  return (
    <div className="bg-surfaceLight rounded p-4">
      <label className="block text-sm text-muted mb-2">Fichier vidéo</label>

      {status !== 'done' && (
        <>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="text-sm text-ink file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-surface file:text-ink file:text-sm hover:file:bg-night transition"
          />

          {file && status === 'idle' && (
            <button
              type="button"
              onClick={handleUpload}
              className="mt-3 bg-primary text-white text-sm font-medium px-4 py-2 rounded hover:brightness-110 transition"
            >
              Lancer l'upload
            </button>
          )}
        </>
      )}

      {status === 'uploading' && (
        <div className="mt-3">
          <div className="w-full h-2 bg-surface rounded overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted mt-1">
            {progress}% envoyé — les gros fichiers peuvent prendre plusieurs minutes,
            ne ferme pas cette page. En cas de coupure réseau, l'upload reprendra
            automatiquement là où il s'est arrêté.
          </p>
        </div>
      )}

      {status === 'done' && (
        <p className="text-sm text-primary">
          ✓ Vidéo envoyée avec succès (Cloudflare l'encode maintenant en arrière-plan)
        </p>
      )}

      {status === 'error' && <p className="text-sm text-alert mt-2">{error}</p>}
    </div>
  );
}
