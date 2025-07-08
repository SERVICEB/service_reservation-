import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <div className="logo">
        <span className="logo-main">EMA</span>
        <span className="logo-sub">Résidences</span>
      </div>

      <nav className="nav">
        <Link to="/inscription" className="nav-link">S'inscrire</Link>
        <Link to="/connexion" className="nav-link">Se connecter</Link>
      </nav>
    </header>
  );
}
