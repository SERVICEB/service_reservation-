import React, { useEffect, useState } from 'react';
import './AnnonceListPage.css';

const AnnonceListPage = () => {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnonces = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/annonces', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Erreur réseau');
        }

        const data = await res.json();
        setAnnonces(data);
      } catch (err) {
        console.error('Erreur chargement des annonces :', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnonces();
  }, []);

  return (
    <div className="annonce-list-page">
      <h1>Toutes les annonces</h1>

      {loading ? (
        <p>Chargement...</p>
      ) : annonces.length === 0 ? (
        <p>Aucune annonce trouvée.</p>
      ) : (
        <div className="annonce-grid">
          {annonces.map((a, i) => (
            <div key={i} className="annonce-card">
              <img
                src={a.images && a.images.length > 0 ? a.images[0] : '/default-image.jpg'}
                alt="Aperçu"
              />
              <h3>{a.typeBien} - {a.ville}</h3>
              <p><strong>Prix :</strong> {a.prix?.toLocaleString()} FCFA</p>
              <p><strong>Quartier :</strong> {a.quartier}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnonceListPage;
