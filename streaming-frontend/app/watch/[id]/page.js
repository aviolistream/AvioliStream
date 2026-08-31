'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getToken } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import VideoPlayer from '../../../components/VideoPlayer';

export default function WatchPage() {
  const { id } = useParams();
  const router = useRouter();
  const [content, setContent] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [error, setError] = useState('');
  const lastSaved = useRef(0);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    api
      .getContent(id)
      .then((data) => {
        setContent(data);
        // Si c'est une série, on sélectionne automatiquement le premier épisode de la première saison
        if (data.seasons && data.seasons.length > 0 && data.seasons[0].episodes.length > 0) {
          setSelectedEpisode(data.seasons[0].episodes[0]);
        }
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const handleProgress = useCallback(
    (seconds) => {
      // On enregistre la progression toutes les 15 secondes pour ne pas spammer l'API
      if (seconds - lastSaved.current < 15) return;
      lastSaved.current = seconds;

      // NOTE : profileId à remplacer par le profil actif une fois la sélection
      // de profils implémentée côté frontend (pour l'instant, géré au niveau backend).
      const profileId = localStorage.getItem('activeProfileId');
      if (!profileId) return;

      api.updateProgress({
        profileId,
        contentId: id,
        episodeId: selectedEpisode?.id,
        progressSeconds: seconds,
      }).catch(() => {});
    },
    [id, selectedEpisode]
  );

  if (error) {
    return <p className="p-8 text-alert">{error}</p>;
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        Chargement...
      </div>
    );
  }

  const playbackUrl = content.movie
    ? content.movie.playbackUrl
    : selectedEpisode?.playbackUrl;

  const poster = content.movie ? content.movie.thumbnailUrl : selectedEpisode?.thumbnailUrl;

  return (
    <div>
      <Navbar />

      <div className="px-8 py-6">
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden mb-6">
          {playbackUrl ? (
            <VideoPlayer playbackUrl={playbackUrl} poster={poster} onProgress={handleProgress} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              Aucune vidéo disponible.
            </div>
          )}
        </div>

        <h1 className="font-display uppercase tracking-wide text-3xl mb-2">{content.title}</h1>
        <p className="text-muted mb-6 max-w-2xl">{content.description}</p>

        {content.seasons && content.seasons.length > 0 && (
          <div>
            {content.seasons.map((season) => (
              <div key={season.id} className="mb-8">
                <h2 className="font-display uppercase tracking-wide text-lg mb-3">Saison {season.seasonNumber}</h2>
                <div className="flex flex-col gap-2">
                  {season.episodes.map((ep) => (
                    <button
                      key={ep.id}
                      onClick={() => setSelectedEpisode(ep)}
                      className={`text-left px-4 py-3 rounded flex items-center gap-3 transition ${
                        selectedEpisode?.id === ep.id
                          ? 'bg-surfaceLight border border-primary/50'
                          : 'bg-surface hover:bg-surfaceLight'
                      }`}
                    >
                      <span className="text-muted text-sm w-6">{ep.episodeNumber}</span>
                      <span className="text-sm">{ep.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
