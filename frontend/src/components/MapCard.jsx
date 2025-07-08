/* --------- File: src/components/MapCard.jsx --------- */
import React from 'react';
import './MapCard.css';

export default function MapCard() {
  return (
    <div className="map-card">
      <img
        src="https://source.unsplash.com/400x380/?map"
        alt="Carte Abidjan"
        className="map-img"
      />
      <div className="marker"></div>
    </div>
  );
}

