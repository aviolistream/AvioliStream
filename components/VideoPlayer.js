'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

/**
 * Lecteur vidéo compatible avec les flux HLS (.m3u8) de Cloudflare Stream.
 * Safari/iOS lisent le HLS nativement, donc on utilise hls.js seulement
 * pour les navigateurs qui ne le supportent pas nativement (Chrome, Firefox).
 */
export default function VideoPlayer({ playbackUrl, startAtSeconds = 0, onProgress, poster }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackUrl) return;

    let hls;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari / iOS : lecture native du HLS
      video.src = playbackUrl;
    } else if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(playbackUrl);
      hls.attachMedia(video);
    }

    video.currentTime = startAtSeconds;

    return () => {
      if (hls) hls.destroy();
    };
  }, [playbackUrl]);

  function handleTimeUpdate(e) {
    if (onProgress) {
      onProgress(Math.floor(e.target.currentTime));
    }
  }

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      poster={poster}
      onTimeUpdate={handleTimeUpdate}
      className="w-full h-full bg-black"
    />
  );
}
