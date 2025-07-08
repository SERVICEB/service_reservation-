import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  createReservation
} from '../controllers/reservationController.js';

import Reservation from '../models/Reservation.js';
import Residence from '../models/Residence.js';

const router = express.Router();

// ✅ Créer une réservation (via contrôleur)
router.post('/', authMiddleware, createReservation);

// ✅ IMPORTANT: Routes spécifiques AVANT les routes avec paramètres
// Statistiques des réservations (propriétaire)
router.get('/stats/owner', authMiddleware, async (req, res) => {
  try {
    const ownerId = req.user.id;
    console.log('Stats demandées pour le propriétaire:', ownerId);

    const residences = await Residence.find({ owner: ownerId });
    const residenceIds = residences.map(r => r._id);

    console.log('Résidences trouvées:', residenceIds.length);

    const [total, confirmed, pending, cancelled, revenue] = await Promise.all([
      Reservation.countDocuments({ residence: { $in: residenceIds } }),
      Reservation.countDocuments({ residence: { $in: residenceIds }, status: 'confirmée' }),
      Reservation.countDocuments({ residence: { $in: residenceIds }, status: 'en attente' }),
      Reservation.countDocuments({ residence: { $in: residenceIds }, status: 'annulée' }),
      Reservation.aggregate([
        { $match: { residence: { $in: residenceIds }, status: 'confirmée' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ])
    ]);

    const stats = {
      totalReservations: total,
      confirmedReservations: confirmed,
      pendingReservations: pending,
      cancelledReservations: cancelled,
      totalRevenue: revenue[0]?.total || 0
    };

    console.log('Stats calculées:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Erreur stats réservations :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ✅ Récupérer les réservations d'un propriétaire
router.get('/owner', authMiddleware, async (req, res) => {
  try {
    const ownerId = req.user.id;
    console.log('Réservations demandées pour le propriétaire:', ownerId);

    const residences = await Residence.find({ owner: ownerId });
    const residenceIds = residences.map(r => r._id);

    console.log('Résidences du propriétaire:', residenceIds.length);

    const reservations = await Reservation.find({ residence: { $in: residenceIds } })
      .populate('user', 'name email phone')
      .populate('residence', 'title location prixParNuit price')
      .sort({ createdAt: -1 });

    console.log('Réservations trouvées:', reservations.length);
    res.json(reservations);
  } catch (error) {
    console.error('Erreur réservations propriétaire :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ✅ Récupérer les réservations d'un client
router.get('/client', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const reservations = await Reservation.find({ user: userId })
      .populate('residence', 'title location prixParNuit price media')
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (error) {
    console.error('Erreur réservations client :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ✅ Modifier le statut d'une réservation - ROUTE CORRIGÉE
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const ownerId = req.user.id;

    console.log('Tentative de modification du statut:', {
      reservationId: id,
      newStatus: status,
      ownerId: ownerId
    });

    // Vérifier que le statut est valide
    const validStatuses = ['en attente', 'confirmée', 'annulée'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    // Trouver la réservation avec la résidence populated
    const reservation = await Reservation.findById(id).populate('residence');
    if (!reservation) {
      console.log('Réservation non trouvée:', id);
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    console.log('Réservation trouvée:', {
      id: reservation._id,
      residenceOwner: reservation.residence.owner,
      currentUser: ownerId,
      isOwner: reservation.residence.owner.toString() === ownerId.toString()
    });

    // CORRECTION: Vérifier si l'utilisateur est le propriétaire de la résidence
    if (reservation.residence.owner.toString() !== ownerId.toString()) {
      console.log('Accès refusé - utilisateur pas propriétaire');
      return res.status(403).json({ 
        message: 'Vous n\'avez pas les permissions pour modifier cette réservation',
        debug: {
          residenceOwner: reservation.residence.owner.toString(),
          currentUser: ownerId.toString()
        }
      });
    }

    // Mettre à jour le statut
    reservation.status = status;
    await reservation.save();

    console.log('Statut mis à jour avec succès:', status);

    // Repopuler les données pour la réponse
    await reservation.populate('user', 'name email');
    await reservation.populate('residence', 'title location');

    res.json({
      message: 'Statut mis à jour avec succès',
      reservation: reservation
    });
  } catch (error) {
    console.error('Erreur mise à jour statut :', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ Récupérer une réservation par ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reservation = await Reservation.findById(id)
      .populate('user', 'name email phone')
      .populate('residence', 'title location prixParNuit price media owner');

    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée' });

    const isOwner = reservation.residence.owner.toString() === userId.toString();
    const isClient = reservation.user._id.toString() === userId.toString();

    if (!isOwner && !isClient) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    res.json(reservation);
  } catch (error) {
    console.error('Erreur récupération réservation :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ✅ Supprimer une réservation
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reservation = await Reservation.findById(id).populate('residence');
    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée' });

    const isOwner = reservation.residence.owner.toString() === userId.toString();
    const isClient = reservation.user.toString() === userId.toString();

    if (!isOwner && !isClient) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await Reservation.findByIdAndDelete(id);
    res.json({ message: 'Réservation supprimée' });
  } catch (error) {
    console.error('Erreur suppression réservation :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

export default router;