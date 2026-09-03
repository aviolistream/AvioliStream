const { PrismaClient } = require('@prisma/client');

// Une seule instance partagée dans toute l'application
const prisma = new PrismaClient();

module.exports = prisma;
