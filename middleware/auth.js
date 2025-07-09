// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * 🔐 Middleware d'authentification : vérifie le token et récupère l'utilisateur
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Accès refusé. Token manquant ou mal formaté.' });
    }

    const token = authHeader.substring(7); // Supprime "Bearer "

    // Vérifie et décode le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupère l'utilisateur dans la BDD sans le mot de passe
    const user = await User.findById(decoded.id || decoded._id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Token invalide : utilisateur non trouvé.' });
    }

    // Injecte les infos utilisateur dans req.user
    req.user = {
      id: user._id,
      role: user.role || 'utilisateur',
      email: user.email,
      nom: user.nom,
      telephone: user.telephone,
    };

    next();
  } catch (error) {
    console.error('❌ Erreur d\'authentification :', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide.' });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré.' });
    }

    res.status(500).json({ message: 'Erreur serveur lors de l\'authentification.' });
  }
};

/**
 * ✅ Middleware d'autorisation : limite l'accès à certains rôles
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: '⛔ Accès interdit : rôle non autorisé.' });
    }
    next();
  };
};

export default auth;
