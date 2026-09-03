const jwt = require('jsonwebtoken');

/**
 * Vérifie le token JWT envoyé dans le header Authorization.
 * Si valide, attache l'utilisateur (id, email) à req.user
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentification requise.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { userId, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
}

/**
 * Middleware optionnel pour protéger les routes réservées aux admins
 * (upload de contenu, gestion du catalogue).
 * Pour simplifier au démarrage, on vérifie un champ isAdmin sur le user
 * (à ajouter dans le schéma Prisma si besoin, ou gérer via une liste d'emails admin en .env).
 */
function requireAdmin(req, res, next) {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());

  if (!req.user || !adminEmails.includes(req.user.email)) {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
