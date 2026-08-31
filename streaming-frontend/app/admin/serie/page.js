'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import Navbar from '../../../components/Navbar';

export default function AddSeriesPage() {
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
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const series = await api.createSeries({
        title: form.title,
        description: form.description,
        posterUrl: form.posterUrl || undefined,
        bannerUrl: form.bannerUrl || undefined,
        releaseYear: form.releaseYear ? Number(form.releaseYear) : undefined,
        genres: form.genres ? form.genres.split(',').map((g) => g.trim()) : [],
        ageRating: form.ageRating || undefined,
      });
      // On redirige directement vers l'ajout du premier épisode
      router.push(`/admin/episode?contentId=${series.id}&title=${encodeURIComponent(series.title)}`);
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
        <h1 className="font-display uppercase tracking-wide text-3xl mb-2">Ajouter une série</h1>
        <p className="text-muted text-sm mb-6">
          Commence par les informations générales de la série. Tu ajouteras les épisodes juste après.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="text-alert text-sm">{error}</p>}

          <input
            type="text"
            placeholder="Titre de la série"
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
            {saving ? 'Enregistrement...' : "Continuer vers l'ajout d'épisodes"}
          </button>
        </form>
      </div>
    </div>
  );
}
