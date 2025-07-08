import Annonce from '../models/Annonce.js';

// ➕ Créer une annonce avec images uploadées
export const createAnnonce = async (req, res) => {
  try {
    // 🔗 Créer les URLs accessibles publiquement pour chaque image
    const imageUrls = req.files.map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`);

    // 🛠️ Conversion des types et préparation des données
    const data = {
      ...req.body,
      prix: req.body.prix ? Number(req.body.prix) : 0,
      superficie: req.body.superficie ? Number(req.body.superficie) : 0,
      chambres: req.body.chambres ? Number(req.body.chambres) : 0,
      salons: req.body.salons ? Number(req.body.salons) : 0,
      cuisines: req.body.cuisines ? Number(req.body.cuisines) : 0,
      sallesBain: req.body.sallesBain ? Number(req.body.sallesBain) : 0,
      toilettes: req.body.toilettes ? Number(req.body.toilettes) : 0,
      balcon: req.body.balcon === 'true',
      garage: req.body.garage === 'true',
      piscine: req.body.piscine === 'true',
      images: imageUrls,
    };

    // 💾 Sauvegarde dans la base de données
    const annonce = new Annonce(data);
    await annonce.save();

    res.status(201).json(annonce);
  } catch (err) {
    console.error('Erreur création annonce :', err);
    res.status(400).json({ error: err.message });
  }
};

// 📋 Récupérer toutes les annonces
export const getAllAnnonces = async (_req, res) => {
  try {
    const annonces = await Annonce.find().sort({ createdAt: -1 });
    res.status(200).json(annonces);
  } catch (err) {
    console.error('Erreur récupération annonces :', err);
    res.status(500).json({ error: 'Impossible de récupérer les annonces' });
  }
};

// 🔍 Récupérer une annonce par ID
export const getAnnonceById = async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id);
    if (!annonce) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }
    res.status(200).json(annonce);
  } catch (err) {
    console.error('Erreur récupération annonce par ID :', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de l’annonce' });
  }
};
