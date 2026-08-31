'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '../../lib/api';
import Navbar from '../../components/Navbar';

export default function AdminDashboard() {
  const router = useRouter();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    api
      .getCatalog()
      .then(setContents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Navbar />

      <div className="px-8 py-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display uppercase tracking-wide text-3xl">Gestion du catalogue</h1>
          <div className="flex gap-3">
            <a
              href="/admin/film"
              className="bg-primary text-white font-medium px-4 py-2 rounded text-sm hover:brightness-110 transition"
            >
              + Ajouter un film
            </a>
            <a
              href="/admin/serie"
              className="bg-surfaceLight text-ink font-medium px-4 py-2 rounded text-sm hover:bg-surface transition border border-white/10"
            >
              + Ajouter une série
            </a>
          </div>
        </div>

        {error && (
          <p className="text-alert text-sm mb-4">
            {error} — vérifie que ton compte est bien dans la liste ADMIN_EMAILS du backend.
          </p>
        )}

        {loading ? (
          <p className="text-muted">Chargement...</p>
        ) : contents.length === 0 ? (
          <p className="text-muted">Aucun contenu pour l'instant. Commence par ajouter un film ou une série.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {contents.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between bg-surface rounded px-4 py-3"
              >
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-muted">
                    {c.type === 'MOVIE' ? 'Film' : 'Série'}
                    {c.type === 'SERIES' && ` · ${c.seasons?.length || 0} saison(s)`}
                  </p>
                </div>
                {c.type === 'SERIES' && (
                  <a
                    href={`/admin/episode?contentId=${c.id}&title=${encodeURIComponent(c.title)}`}
                    className="text-sm text-primary hover:underline"
                  >
                    + Ajouter un épisode
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
