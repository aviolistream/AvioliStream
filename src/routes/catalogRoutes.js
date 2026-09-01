const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  getUploadUrl,
  createMovie,
  createSeries,
  createEpisode,
  listCatalog,
  getContentDetails,
} = require('../controllers/catalogController');

// Routes publiques (utilisateurs connectés) : parcourir le catalogue
router.get('/', requireAuth, listCatalog);
router.get('/:id', requireAuth, getContentDetails);

// Routes admin : gestion du contenu (upload de films/séries)
router.post('/upload-url', requireAuth, requireAdmin, getUploadUrl);
router.post('/movies', requireAuth, requireAdmin, createMovie);
router.post('/series', requireAuth, requireAdmin, createSeries);
router.post('/episodes', requireAuth, requireAdmin, createEpisode);

module.exports = router;
