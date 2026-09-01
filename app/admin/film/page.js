'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import VideoUploadField from '../../../components/VideoUploadField';

export default function AddMoviePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    posterUrl: '',
    bannerUrl: '',
    releaseYear: '',
    genres: '',
    ageRating: '',
  });
  const [videoId, setVideoId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!videoId) {
      setError("Upload d'abord le fichier vidéo avant d'enregistrer le film.");
      return;
    }

    setSaving(true);
    try {
      await api.createMovie({
        title: form.title,
        description: form.description,
        posterUrl: form.posterUrl || undefined,
        bannerUrl: form.bannerUrl || undefined,
        releaseYear: form.releaseYear ? Number(form.releaseYear) : undefined,
        genres: form.genres ? form.genres.split(',').map((g) => g.trim()) : [],
        ageRating: form.ageRating || undefined,
        cloudflareVideoId: videoId,
      });
      router.push('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Navbar />

      <div className="px-8 py-8 max-w-xl mx-auto">
        <h1 className="font-display uppercase tracking-wide text-3xl mb-6">Ajouter un film</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="text-alert text-sm">{error}</p>}

          <VideoUploadField onUploaded={setVideoId} />

          <input
            type="text"
            placeholder="Titre"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            required
            className="bg-surface rounded px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            required
            rows={4}
            className="bg-surface rounded px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <input
            type="url"
            placeholder="URL de l'affiche (poster, format portrait)"
            value={form.posterUrl}
            onChange={(e) => update('posterUrl', e.target.value)}
            className="bg-surface rounded px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="url"
            placeholder="URL de la bannière (format large, page d'accueil)"
            value={form.bannerUrl}
            onChange={(e) => update('bannerUrl', e.target.value)}
            className="bg-surface rounded px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-4">
            <input
              type="number"
              placeholder="Année de sortie"
              value={form.releaseYear}
              onChange={(e) => update('releaseYear', e.target.value)}
              className="bg-surface rounded px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary flex-1"
            />
            <input
              type="text"
              placeholder="Âge minimum (ex: 13+)"
              value={form.ageRating}
              onChange={(e) => update('ageRating', e.target.value)}
              className="bg-surface rounded px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary flex-1"
            />
          </div>
          <input
            type="text"
            placeholder="Genres séparés par des virgules (ex: Action, Drame)"
            value={form.genres}
            onChange={(e) => update('genres', e.target.value)}
            className="bg-surface rounded px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />

          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-white font-medium rounded px-4 py-3 mt-2 hover:brightness-110 transition disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Ajouter au catalogue'}
          </button>
        </form>
      </div>
    </div>
  );
}
