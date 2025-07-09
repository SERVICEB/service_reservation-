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

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📂 Création du dossier /uploads s'il n'existe pas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// 📸 Servir les images uploadées de manière publique
app.use('/uploads', express.static(uploadsPath));

// 🧪 Route de test
app.get('/', (_req, res) => res.send('✅ API EMA Résidences & Annonces est opérationnelle'));

// 📌 Routes API
app.use('/api/residences', residenceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/annonces', annoncesRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Serveur en ligne : http://localhost:${PORT}`)
);
