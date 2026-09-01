const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  updateProgress,
  getContinueWatching,
  addToMyList,
  removeFromMyList,
  getMyList,
} = require('../controllers/watchController');

router.post('/progress', requireAuth, updateProgress);
router.get('/continue-watching/:profileId', requireAuth, getContinueWatching);

router.post('/my-list', requireAuth, addToMyList);
router.delete('/my-list', requireAuth, removeFromMyList);
router.get('/my-list/:profileId', requireAuth, getMyList);

module.exports = router;
