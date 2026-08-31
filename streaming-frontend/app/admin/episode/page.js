'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import VideoUploadField from '../../../components/VideoUploadField';

export default function AddEpisodePage() {
  return (
    <Suspense fallback={null}>
      <AddEpisodeForm />
    </Suspense>
  );
}

function AddEpisodeForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const contentId = searchParams.get('contentId');
  const seriesTitle = searchParams.get('title');

  const [form, setForm] = useState({ seasonNumber: '1', episodeNumber: '1', title: '', description: '' });
  const [videoId, setVideoId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [justAdded, setJustAdded] = useState(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function resetForNextEpisode(currentEpisodeNumber) {
    setForm((f) => ({ ...f, episodeNumber: String(currentEpisodeNumber + 1), title: '', description: '' }));
    setVideoId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!videoId) {
      setError("Upload d'abord le fichier vidéo avant d'enregistrer l'épisode.");
      return;
    }
    if (!contentId) {
      setError('Série introuvable — reviens au tableau de bord et réessaie.');
      return;
    }

    setSaving(true);
    try {
      await api.createEpisode({
        contentId,
        seasonNumber: Number(form.seasonNumber),
        episodeNumber: Number(form.episodeNumber),
        title: form.title,
        description: form.description || undefined,
        cloudflareVideoId: videoId,
      });
      setJustAdded(`S${form.seasonNumber}E${form.episodeNumber} — ${form.title}`);
      resetForNextEpisode(Number(form.episodeNumber));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!contentId) {
    return (
      <div>
        <Navbar />
        <div className="px-8 py-8 max-w-xl mx-auto">
          <p className="text-alert">
            Aucune série sélectionnée. Retourne au{' '}
            <a href="/admin" className="text-primary hover:underline">tableau de bord</a> et
            choisis "+ Ajouter un épisode" sur une série existante.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className="px-8 py-8 max-w-xl mx-auto">
        <h1 className="font-display uppercase tracking-wide text-3xl mb-1">Ajouter un épisode</h1>
        {seriesTitle && <p className="text-muted text-sm mb-6">Série : {seriesTitle}</p>}

        {justAdded && (
          <p className="text-sm text-primary bg-surface rounded px-4 py-3 mb-4">
            ✓ {justAdded} ajouté. Tu peux enchaîner avec l'épisode suivant.
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="text-alert text-sm">{error}</p>}

          <VideoUploadField key={form.episodeNumber} onUploaded={setVideoId} />

          <div className="flex gap-4">
            <input
              type="number"
              min="1"
              placeholder="N° saison"
              value={form.seasonNumber}
              onChange={(e) => update('seasonNumber', e.target.value)}
              required
              className="bg-surface rounded px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary flex-1"
            />
            <input
              type="number"
              min="1"
              placeholder="N° épisode"
              value={form.episodeNumber}
              onChange={(e) => update('episodeNumber', e.target.value)}
              required
              className="bg-surface rounded px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary flex-1"
            />
          </div>

          <input
            type="text"
            placeholder="Titre de l'épisode"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            required
            className="bg-surface rounded px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <textarea
            placeholder="Description (optionnel)"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={3}
            className="bg-surface rounded px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
          />

          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-white font-medium rounded px-4 py-3 mt-2 hover:brightness-110 transition disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : "Ajouter l'épisode"}
          </button>

          <a href="/admin" className="text-center text-sm text-muted hover:text-ink transition">
            Terminer et retourner au tableau de bord
          </a>
        </form>
      </div>
    </div>
  );
}
