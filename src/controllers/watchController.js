const { z } = require('zod');
const prisma = require('../prisma/client');

const updateProgressSchema = z.object({
  profileId: z.string().uuid(),
  contentId: z.string().uuid(),
  episodeId: z.string().uuid().optional(),
  progressSeconds: z.number().int().min(0),
  completed: z.boolean().optional(),
});

/**
 * Sauvegarde la progression de lecture (appelé régulièrement par le lecteur
 * vidéo côté frontend, ex: toutes les 10-15 secondes).
 */
async function updateProgress(req, res) {
  const parsed = updateProgressSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { profileId, contentId, episodeId, progressSeconds, completed } = parsed.data;

  const entry = await prisma.watchHistory.upsert({
    where: {
      profileId_contentId_episodeId: {
        profileId,
        contentId,
        episodeId: episodeId ?? null,
      },
    },
    update: { progressSeconds, completed: completed ?? false },
    create: { profileId, contentId, episodeId, progressSeconds, completed: completed ?? false },
  });

  return res.json(entry);
}

/**
 * "Continuer à regarder" - liste des contenus en cours pour un profil.
 */
async function getContinueWatching(req, res) {
  const { profileId } = req.params;

  const items = await prisma.watchHistory.findMany({
    where: { profileId, completed: false },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    include: { content: true, episode: true },
  });

  return res.json(items);
}

/**
 * Ajouter/retirer un contenu de "Ma liste".
 */
async function addToMyList(req, res) {
  const { profileId, contentId } = req.body;

  const item = await prisma.myListItem.upsert({
    where: { profileId_contentId: { profileId, contentId } },
    update: {},
    create: { profileId, contentId },
  });

  return res.status(201).json(item);
}

async function removeFromMyList(req, res) {
  const { profileId, contentId } = req.body;

  await prisma.myListItem.delete({
    where: { profileId_contentId: { profileId, contentId } },
  });

  return res.status(204).send();
}

async function getMyList(req, res) {
  const { profileId } = req.params;

  const items = await prisma.myListItem.findMany({
    where: { profileId },
    orderBy: { addedAt: 'desc' },
    include: { content: true },
  });

  return res.json(items);
}

module.exports = {
  updateProgress,
  getContinueWatching,
  addToMyList,
  removeFromMyList,
  getMyList,
};
