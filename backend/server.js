import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import residenceRoutes from './routes/residenceRoutes.js';
import authRoutes from './routes/authRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import annoncesRoutes from './routes/annoncesRoutes.js';

// Configuration des variables d'environnement
dotenv.config();

// Connexion à MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 📂 Création du dossier /uploads s'il n'existe pas (avec gestion d'erreurs)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.join(__dirname, 'uploads');

try {
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('📁 Dossier uploads créé avec succès');
  }
} catch (error) {
  console.warn('⚠️ Impossible de créer le dossier uploads:', error.message);
  console.warn('💡 Conseil: Utilisez un service cloud pour le stockage d\'images en production');
}

// 📸 Servir les images uploadées de manière publique
app.use('/uploads', express.static(uploadsPath));

// 🧪 Route de test
app.get('/', (_req, res) => {
  res.json({
    message: '✅ API EMA Résidences & Annonces est opérationnelle',
    status: 'success',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 📌 Routes API
app.use('/api/residences', residenceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/annonces', annoncesRoutes);

// 🔍 Route pour vérifier la santé de l'API
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage()
  });
});

// 404 Handler
app.use('*', (_req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    message: 'L\'endpoint demandé n\'existe pas'
  });
});

// Gestionnaire d'erreurs global
app.use((error, _req, res, _next) => {
  console.error('❌ Erreur serveur:', error);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
  });
});

// Configuration du port (compatible Render)
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Démarrage du serveur
app.listen(PORT, HOST, () => {
  console.log(`🚀 Serveur en ligne : http://${HOST}:${PORT}`);
  console.log(`🌍 Environnement : ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Démarré le : ${new Date().toLocaleString()}`);
  console.log(`✅ MongoDB connecté avec succès`);
});

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', () => {
  console.log('💤 Arrêt du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('💤 Arrêt du serveur...');
  process.exit(0);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  console.error('❌ Erreur non gérée:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Exception non capturée:', err);
  process.exit(1);
});