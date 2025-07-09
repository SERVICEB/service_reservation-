// src/components/ActionSidebar.jsx
import React from 'react';
import { FiCalendar, FiPlus, FiList } from 'react-icons/fi'; // ⬅️ Ajout de FiList
import { Link } from 'react-router-dom';
import './ActionSidebar.css';

export default function ActionSidebar() {
  return (
    <div className="action-sidebar">
      <Link to="/reserve" className="action-card">
        <FiCalendar size={24} />
        <p className="action-title">
          Réserver<br />une résidence
        </p>
      </Link>

      <Link to="/annonce/new" className="action-card">
        <FiPlus size={24} />
        <p className="action-title">
          Publier<br />une annonce
        </p>
      </Link>

      {/* ✅ Nouveau bouton : Voir les annonces */}
      <Link to="/annonces" className="action-card">
        <FiList size={24} />
        <p className="action-title">
          Voir<br />les annonces
        </p>
      </Link>
    </div>
  );
}
