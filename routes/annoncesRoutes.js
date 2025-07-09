import express from 'express';
import multer from 'multer';
import auth, { authorizeRoles } from '../middleware/auth.js';
import {
  createAnnonce,
  getAllAnnonces,
  getAnnonceById,
} from '../controllers/annonceController.js';

const router = express.Router();

// 📦 Configuration Multer
const storage = multer.diskStorage({
  destination: 'uploads/', // dossier où les fichiers seront stockés
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ Création d'une annonce (propriétaire connecté uniquement)
router.post(
  '/',
  auth,
  authorizeRoles('owner'),
  upload.array('images', 10), // maximum 10 images
  createAnnonce
);

// ✅ Lecture des annonces
router.get('/', getAllAnnonces);
router.get('/:id', getAnnonceById);

export default router;
