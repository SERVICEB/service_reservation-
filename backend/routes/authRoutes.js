// --------- File: ema-residences-backend/routes/authRoutes.js ---------
import express from 'express';
import { registerUser, authUser } from '../controllers/authController.js';

const router = express.Router();

// Route POST pour l'inscription d'un utilisateur
router.post('/register', registerUser);

// Route POST pour la connexion d'un utilisateur
router.post('/login', authUser);

export default router;
