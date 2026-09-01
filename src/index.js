require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const watchRoutes = require('./routes/watchRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const { handleWebhook } = require('./controllers/subscriptionController');

const app = express();

app.use(cors());

// IMPORTANT : le webhook Stripe doit recevoir le body BRUT (non parsé en JSON)
// pour pouvoir vérifier la signature. On le déclare donc AVANT express.json().
app.post(
  '/api/subscriptions/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

// Pour toutes les autres routes, on parse le JSON normalement
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'streaming-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/watch', watchRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Gestion basique des erreurs non interceptées
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Serveur backend streaming démarré sur le port ${PORT}`);
});
