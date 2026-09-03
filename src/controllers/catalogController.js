const { z } = require('zod');
const multer = require('multer');
const fs = require('fs');
const prisma = require('../prisma/client');
const cloudflareStream = require('../services/cloudflareStream');

// Stocke temporairement le fichier reçu sur le disque du serveur,
// le temps de le retransmettre à Cloudflare, avant de le supprimer.
const upload = multer({ dest: '/tmp/uploads/', limits: { fileSize: 200 * 1024 * 1024 } });

/**
 * Reçoit le fichier vidéo du navigateur puis le retransmet à Cloudflare
 * Stream DEPUIS LE SERVEUR (pas depuis le navigateur), pour éviter les
 * soucis de CORS que Cloudflare impose sur les uploads directs.
 */
const uploadVideoMiddleware = upload.single('file');

async function uploadVideo(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier reçu.' });
  }

  try {
    const { videoId } = await cloudflareStream.uploadFileFromServer(
      req.file.path,
      req.file.originalname
    );
    return res.json({ videoId });
  } catch (err) {
    console.error('Erreur Cloudflare Stream:', err.response?.data || err.message);
    return res.status(500).json({ error: "Échec de l'envoi de la vidéo vers Cloudflare." });
  } finally {
    // On nettoie le fichier temporaire, qu'il y ait eu succès ou échec
    fs.unlink(req.file.path, () => {});
  }
}

/**
 * Étape 1 de l'ajout d'un film/épisode : le back demande à Cloudflare une
 * session d'upload TUS (adaptée aux gros fichiers, avec reprise automatique),
 * que l'admin (ou l'interface d'upload) utilisera ensuite pour envoyer le
 * fichier vidéo DIRECTEMENT à Cloudflare, par morceaux.
 */
async function getUploadUrl(req, res) {
  const { fileName, fileSize } = req.body;

  if (!fileSize) {
    return res.status(400).json({ error: 'fileSize est requis pour démarrer un upload.' });
  }

  try {
    const { uploadUrl, videoId } = await cloudflareStream.createTusUpload({ fileName, fileSize });
    return res.json({ uploadUrl, videoId });
  } catch (err) {
    console.error('Erreur Cloudflare Stream:', err.response?.data || err.message);
    return res.status(500).json({ error: "Impossible de générer l'URL d'upload." });
  }
}

const createMovieSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  posterUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  releaseYear: z.number().optional(),
  genres: z.array(z.string()).default([]),
  ageRating: z.string().optional(),
  cloudflareVideoId: z.string().min(1), // obtenu après upload terminé
});

/**
 * Étape 2 : une fois la vidéo uploadée sur Cloudflare (videoId en main),
 * on crée l'entrée du film dans notre catalogue.
 */
async function createMovie(req, res) {
  const parsed = createMovieSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const data = parsed.data;

  const content = await prisma.content.create({
    data: {
      title: data.title,
      description: data.description,
      type: 'MOVIE',
      posterUrl: data.posterUrl,
      bannerUrl: data.bannerUrl,
      releaseYear: data.releaseYear,
      genres: data.genres,
      ageRating: data.ageRating,
      movie: {
        create: {
          cloudflareVideoId: data.cloudflareVideoId,
        },
      },
    },
    include: { movie: true },
  });

  return res.status(201).json(content);
}

const createSeriesSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  posterUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  releaseYear: z.number().optional(),
  genres: z.array(z.string()).default([]),
  ageRating: z.string().optional(),
});

/**
 * Crée l'entrée d'une série dans le catalogue (métadonnées seules).
 * Les saisons/épisodes sont ajoutés ensuite via createEpisode.
 */
async function createSeries(req, res) {
  const parsed = createSeriesSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const data = parsed.data;

  const content = await prisma.content.create({
    data: {
      title: data.title,
      description: data.description,
      type: 'SERIES',
      posterUrl: data.posterUrl,
      bannerUrl: data.bannerUrl,
      releaseYear: data.releaseYear,
      genres: data.genres,
      ageRating: data.ageRating,
    },
  });

  return res.status(201).json(content);
}

const createEpisodeSchema = z.object({
  contentId: z.string().uuid(),
  seasonNumber: z.number().int().min(1),
  episodeNumber: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  cloudflareVideoId: z.string().min(1),
});

/**
 * Ajoute un épisode à une série (crée la saison si elle n'existe pas encore).
 */
async function createEpisode(req, res) {
  const parsed = createEpisodeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const data = parsed.data;

  const season = await prisma.season.upsert({
    where: {
      contentId_seasonNumber: {
        contentId: data.contentId,
        seasonNumber: data.seasonNumber,
      },
    },
    update: {},
    create: {
      contentId: data.contentId,
      seasonNumber: data.seasonNumber,
    },
  });

  const episode = await prisma.episode.create({
    data: {
      seasonId: season.id,
      episodeNumber: data.episodeNumber,
      title: data.title,
      description: data.description,
      cloudflareVideoId: data.cloudflareVideoId,
    },
  });

  return res.status(201).json(episode);
}

/**
 * Liste le catalogue public (films et séries), avec filtres simples.
 */
async function listCatalog(req, res) {
  const { genre, type, search } = req.query;

  const where = {};
  if (genre) where.genres = { has: genre };
  if (type) where.type = type;
  if (search) where.title = { contains: search, mode: 'insensitive' };

  const contents = await prisma.content.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { movie: true, seasons: { include: { episodes: true } } },
  });

  return res.json(contents);
}

/**
 * Détail d'un contenu, avec les URLs de lecture générées à la volée.
 */
async function getContentDetails(req, res) {
  const { id } = req.params;

  const content = await prisma.content.findUnique({
    where: { id },
    include: {
      movie: true,
      seasons: { include: { episodes: true }, orderBy: { seasonNumber: 'asc' } },
    },
  });

  if (!content) {
    return res.status(404).json({ error: 'Contenu introuvable.' });
  }

  // On enrichit la réponse avec les URLs de lecture Cloudflare
  if (content.movie) {
    content.movie.playbackUrl = cloudflareStream.getPlaybackUrl(content.movie.cloudflareVideoId);
    content.movie.thumbnailUrl = cloudflareStream.getThumbnailUrl(content.movie.cloudflareVideoId);
  }

  content.seasons.forEach(season => {
    season.episodes.forEach(episode => {
      episode.playbackUrl = cloudflareStream.getPlaybackUrl(episode.cloudflareVideoId);
      episode.thumbnailUrl = cloudflareStream.getThumbnailUrl(episode.cloudflareVideoId);
    });
  });

  return res.json(content);
}

module.exports = {
  getUploadUrl,
  uploadVideoMiddleware,
  uploadVideo,
  createMovie,
  createSeries,
  createEpisode,
  listCatalog,
  getContentDetails,
};
