const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../prisma/client');

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
  profileName: z.string().min(1).default('Profil principal'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

async function signup(req, res) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { email, password, profileName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // On crée l'utilisateur ET son premier profil en même temps
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      profiles: {
        create: { name: profileName },
      },
      subscription: {
        create: { status: 'TRIALING' },
      },
    },
    include: { profiles: true },
  });

  const token = generateToken(user);

  return res.status(201).json({
    token,
    user: { id: user.id, email: user.email },
    profiles: user.profiles,
  });
}

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Email ou mot de passe invalide.' });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { profiles: true },
  });

  if (!user) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
  }

  const token = generateToken(user);

  return res.json({
    token,
    user: { id: user.id, email: user.email },
    profiles: user.profiles,
  });
}

module.exports = { signup, login };
