'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '../lib/api';
import Navbar from '../components/Navbar';
import ContentRow from '../components/ContentRow';

export default function HomePage() {
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

  const featured = contents[0];

  // Regroupement simple par genre pour organiser les rangées
  const genreMap = {};
  contents.forEach((c) => {
    (c.genres.length ? c.genres : ['Autres']).forEach((g) => {
      if (!genreMap[g]) genreMap[g] = [];
      genreMap[g].push(c);
    });
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        Chargement du catalogue...
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      {error && <p className="px-8 text-alert">{error}</p>}

      {contents.length === 0 && !error && (
        <div className="px-8 py-24 text-center">
          <h2 className="font-display uppercase tracking-wide text-2xl mb-2">Le catalogue est vide pour l'instant</h2>
          <p className="text-muted">Reviens un peu plus tard, on ajoute du contenu régulièrement.</p>
        </div>
      )}

      {featured && (
        <section
          className="relative h-[60vh] flex items-end px-8 pb-12 bg-cover bg-center"
          style={{
            backgroundImage: featured.bannerUrl ? `url(${featured.bannerUrl})` : undefined,
            backgroundColor: '#171B22',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-night via-night/60 to-transparent" />
          <div className="relative max-w-xl">
            <h1 className="font-display uppercase tracking-wide text-4xl md:text-5xl mb-4">{featured.title}</h1>
            <p className="text-ink/80 mb-6 line-clamp-3">{featured.description}</p>
            <a
              href={`/watch/${featured.id}`}
              className="inline-block bg-primary text-white font-medium px-6 py-3 rounded hover:brightness-110 transition"
            >
              Regarder
            </a>
          </div>
        </section>
      )}

      <div className="pt-8 pb-16">
        {Object.entries(genreMap).map(([genre, items]) => (
          <ContentRow key={genre} title={genre} items={items} />
        ))}
      </div>
    </div>
  );
}
