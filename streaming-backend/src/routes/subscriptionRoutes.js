const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { createCheckoutSession } = require('../controllers/subscriptionController');

router.post('/checkout', requireAuth, createCheckoutSession);

module.exports = router;
