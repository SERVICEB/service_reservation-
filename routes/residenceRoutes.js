// 📁 backend/routes/residenceRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import Residence from '../models/Residence.js';
import auth, { authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// 📁 Configuration Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ✅ Liste publique des résidences
router.get('/', async (req, res) => {
  try {
    const { city, title, maxPrice } = req.query;
    const filter = {};

    if (city) filter.location = { $regex: city, $options: 'i' };
    if (title) filter.title = { $regex: title, $options: 'i' };
    if (maxPrice) filter.price = { $lte: Number(maxPrice) };

    const residences = await Residence.find(filter).sort({ createdAt: -1 });
    res.json(residences);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des résidences.' });
  }
});

// ✅ Détails d'une résidence par ID
router.get('/:id', async (req, res) => {
  try {
    const residence = await Residence.findById(req.params.id);
    if (!residence) return res.status(404).json({ message: 'Résidence non trouvée.' });
    res.json(residence);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ✅ Route POST pour la création de résidences
router.post('/', auth, authorizeRoles('owner', 'admin'), upload.array('media', 10), async (req, res) => {
  try {
    console.log('=== DEBUG ROUTE POST ===');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files?.length || 0, 'fichiers');
    console.log('req.user:', req.user);
    
    const {
      title,
      description,
      location,
      address,
      reference,
      type,
      price,
      owner, // ✅ Récupéré depuis le FormData
      amenities,
      existingImages
    } = req.body;

    // ✅ Validation des champs obligatoires selon le schéma
    if (!title?.trim()) {
      return res.status(400).json({ message: 'Le titre est requis.' });
    }
    
    if (!location?.trim()) {
      return res.status(400).json({ message: 'La localisation est requise.' });
    }
    
    if (!type) {
      return res.status(400).json({ message: 'Le type de résidence est requis.' });
    }
    
    // ✅ Validation du prix selon les contraintes du schéma
    const priceNum = Number(price);
    if (!price || isNaN(priceNum) || priceNum < 1000 || priceNum > 1000000) {
      return res.status(400).json({ 
        message: 'Le prix doit être un nombre entre 1000 et 1000000 FCFA.' 
      });
    }

    // ✅ Validation du type selon l'enum du schéma
    const validTypes = ['Hôtel', 'Appartement', 'Villa', 'Studio', 'Suite', 'Chambre'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        message: `Type invalide. Types acceptés: ${validTypes.join(', ')}` 
      });
    }

    // ✅ Vérification unicité de la référence si fournie
    if (reference && reference.trim()) {
      const existingRef = await Residence.findOne({ 
        reference: reference.trim() 
      });
      if (existingRef) {
        return res.status(400).json({ 
          message: 'Cette référence est déjà utilisée pour une autre résidence.' 
        });
      }
    }

    // ✅ Traitement des médias uploadés
    const media = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        media.push({
          url: `/uploads/${file.filename}`,
          type: file.mimetype.startsWith('video/') ? 'video' : 'image'
        });
      }
    }

    // ✅ Ajout des médias existants (pour l'édition)
    let existingMediaArray = [];
    if (existingImages) {
      try {
        existingMediaArray = JSON.parse(existingImages);
        // Validation de la structure des médias existants
        if (Array.isArray(existingMediaArray)) {
          existingMediaArray = existingMediaArray.filter(item => 
            item && typeof item.url === 'string' && 
            ['image', 'video'].includes(item.type)
          );
        } else {
          existingMediaArray = [];
        }
      } catch (error) {
        console.warn('Erreur parsing existingImages:', error);
        existingMediaArray = [];
      }
    }

    // ✅ Traitement des amenities
    let amenitiesArray = [];
    if (amenities) {
      try {
        amenitiesArray = JSON.parse(amenities);
        if (!Array.isArray(amenitiesArray)) {
          amenitiesArray = [];
        }
        // Validation des amenities (doivent être des strings)
        amenitiesArray = amenitiesArray.filter(item => 
          typeof item === 'string' && item.trim().length > 0
        );
      } catch (error) {
        console.warn('Erreur parsing amenities:', error);
        amenitiesArray = [];
      }
    }

    // ✅ Détermination du propriétaire
    // Priorité: owner du FormData, sinon req.user.id
    const ownerId = owner || req.user.id;
    if (!ownerId) {
      return res.status(400).json({ 
        message: 'Propriétaire non défini.' 
      });
    }

    // ✅ Validation des longueurs selon le schéma
    if (title.trim().length > 100) {
      return res.status(400).json({ 
        message: 'Le titre ne peut pas dépasser 100 caractères.' 
      });
    }
    
    if (description && description.length > 1000) {
      return res.status(400).json({ 
        message: 'La description ne peut pas dépasser 1000 caractères.' 
      });
    }

    // ✅ Construction de l'objet résidence
    const residenceData = {
      title: title.trim(),
      type: type,
      price: priceNum,
      location: location.trim(),
      media: [...existingMediaArray, ...media],
      owner: ownerId,
      amenities: amenitiesArray
    };

    // ✅ Ajout des champs optionnels seulement s'ils sont fournis
    if (description && description.trim()) {
      residenceData.description = description.trim();
    }
    
    if (address && address.trim()) {
      residenceData.address = address.trim();
    }
    
    if (reference && reference.trim()) {
      residenceData.reference = reference.trim();
    }

    console.log('Données finales à sauvegarder:', residenceData);

    // ✅ Création et sauvegarde
    const residence = new Residence(residenceData);
    await residence.save();

    console.log('Résidence créée avec succès:', residence._id);
    
    res.status(201).json({
      message: 'Résidence créée avec succès',
      residence: residence
    });

  } catch (err) {
    console.error('Erreur lors de la création de la résidence:', err);
    
    // ✅ Gestion spécifique des erreurs Mongoose
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Erreur de validation', 
        details: errors 
      });
    }
    
    if (err.code === 11000) {
      // Erreur de duplicata (référence unique)
      return res.status(400).json({ 
        message: 'Cette référence est déjà utilisée.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Erreur interne du serveur lors de la création de la résidence.' 
    });
  }
});

// ✅ Route PUT pour la modification de résidences
router.put('/:id', auth, upload.array('media', 10), async (req, res) => {
  try {
    console.log('=== DEBUG ROUTE PUT ===');
    console.log('req.params.id:', req.params.id);
    console.log('req.body:', req.body);
    console.log('req.files:', req.files?.length || 0, 'nouveaux fichiers');
    
    const residenceId = req.params.id;
    
    // ✅ Vérifier que la résidence existe
    const existingResidence = await Residence.findById(residenceId);
    if (!existingResidence) {
      return res.status(404).json({ message: 'Résidence non trouvée.' });
    }
    
    // ✅ Vérifier les permissions (propriétaire ou admin)
    if (existingResidence.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé.' });
    }

    const {
      title,
      description,
      location,
      address,
      reference,
      type,
      price,
      amenities,
      existingImages,
      mediaToDelete
    } = req.body;

    // ✅ Validation des champs obligatoires
    if (title && !title.trim()) {
      return res.status(400).json({ message: 'Le titre ne peut pas être vide.' });
    }
    
    if (location && !location.trim()) {
      return res.status(400).json({ message: 'La localisation ne peut pas être vide.' });
    }
    
    // ✅ Validation du prix
    if (price) {
      const priceNum = Number(price);
      if (isNaN(priceNum) || priceNum < 1000 || priceNum > 1000000) {
        return res.status(400).json({ 
          message: 'Le prix doit être un nombre entre 1000 et 1000000 FCFA.' 
        });
      }
    }

    // ✅ Validation du type
    if (type) {
      const validTypes = ['Hôtel', 'Appartement', 'Villa', 'Studio', 'Suite', 'Chambre'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ 
          message: `Type invalide. Types acceptés: ${validTypes.join(', ')}` 
        });
      }
    }

    // ✅ Vérification unicité de la référence (si modifiée)
    if (reference && reference.trim() && reference.trim() !== existingResidence.reference) {
      const existingRef = await Residence.findOne({ 
        reference: reference.trim(),
        _id: { $ne: residenceId } // Exclure la résidence actuelle
      });
      if (existingRef) {
        return res.status(400).json({ 
          message: 'Cette référence est déjà utilisée pour une autre résidence.' 
        });
      }
    }

    // ✅ Gestion des médias existants
    let currentMedia = [...existingResidence.media];
    
    // Supprimer les médias marqués pour suppression
    if (mediaToDelete) {
      try {
        const mediaToDeleteArray = JSON.parse(mediaToDelete);
        if (Array.isArray(mediaToDeleteArray)) {
          currentMedia = currentMedia.filter(media => 
            !mediaToDeleteArray.includes(media.id || media._id?.toString())
          );
        }
      } catch (error) {
        console.warn('Erreur parsing mediaToDelete:', error);
      }
    }

    // Ajouter les médias existants du frontend
    if (existingImages) {
      try {
        const existingImagesArray = JSON.parse(existingImages);
        if (Array.isArray(existingImagesArray)) {
          const validExistingImages = existingImagesArray.filter(item => 
            item && typeof item.url === 'string' && 
            ['image', 'video'].includes(item.type)
          );
          currentMedia = [...currentMedia, ...validExistingImages];
        }
      } catch (error) {
        console.warn('Erreur parsing existingImages:', error);
      }
    }

    // ✅ Ajouter les nouveaux médias uploadés
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        currentMedia.push({
          url: `/uploads/${file.filename}`,
          type: file.mimetype.startsWith('video/') ? 'video' : 'image'
        });
      }
    }

    // ✅ Traitement des amenities
    let amenitiesArray = existingResidence.amenities;
    if (amenities) {
      try {
        amenitiesArray = JSON.parse(amenities);
        if (!Array.isArray(amenitiesArray)) {
          amenitiesArray = [];
        }
        amenitiesArray = amenitiesArray.filter(item => 
          typeof item === 'string' && item.trim().length > 0
        );
      } catch (error) {
        console.warn('Erreur parsing amenities:', error);
        amenitiesArray = existingResidence.amenities;
      }
    }

    // ✅ Construction de l'objet de mise à jour (seulement les champs fournis)
    const updateData = {
      media: currentMedia,
      amenities: amenitiesArray
    };

    if (title && title.trim()) {
      if (title.trim().length > 100) {
        return res.status(400).json({ 
          message: 'Le titre ne peut pas dépasser 100 caractères.' 
        });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      if (description && description.length > 1000) {
        return res.status(400).json({ 
          message: 'La description ne peut pas dépasser 1000 caractères.' 
        });
      }
      updateData.description = description?.trim() || undefined;
    }

    if (location && location.trim()) {
      updateData.location = location.trim();
    }

    if (address !== undefined) {
      updateData.address = address?.trim() || undefined;
    }

    if (reference !== undefined) {
      updateData.reference = reference?.trim() || undefined;
    }

    if (type) {
      updateData.type = type;
    }

    if (price) {
      updateData.price = Number(price);
    }

    console.log('Données de mise à jour:', updateData);

    // ✅ Mise à jour de la résidence
    const updatedResidence = await Residence.findByIdAndUpdate(
      residenceId,
      updateData,
      { 
        new: true, // Retourner le document mis à jour
        runValidators: true // Exécuter les validations du schéma
      }
    );

    console.log('Résidence mise à jour avec succès:', updatedResidence._id);
    
    res.json({
      message: 'Résidence modifiée avec succès',
      residence: updatedResidence
    });

  } catch (err) {
    console.error('Erreur lors de la modification de la résidence:', err);
    
    // ✅ Gestion spécifique des erreurs Mongoose
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Erreur de validation', 
        details: errors 
      });
    }
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: 'Cette référence est déjà utilisée.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Erreur interne du serveur lors de la modification de la résidence.' 
    });
  }
});

// ✅ Route DELETE pour supprimer une résidence
router.delete('/:id', auth, async (req, res) => {
  try {
    const residenceId = req.params.id;
    
    // Vérifier que la résidence existe
    const residence = await Residence.findById(residenceId);
    if (!residence) {
      return res.status(404).json({ message: 'Résidence non trouvée.' });
    }
    
    // Vérifier les permissions (propriétaire ou admin)
    if (residence.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé.' });
    }

    await Residence.findByIdAndDelete(residenceId);
    
    res.json({
      message: 'Résidence supprimée avec succès'
    });

  } catch (err) {
    console.error('Erreur lors de la suppression:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la suppression de la résidence.' 
    });
  }
});

// ✅ IMPORTANT: Export par défaut du router
export default router;