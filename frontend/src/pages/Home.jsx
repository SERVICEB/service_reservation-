import React, { useEffect, useState } from 'react';
import SearchForm from '../components/SearchForm';
import ResidenceList from '../components/ResidenceList';
import MapCard from '../components/MapCard';
import ActionSidebar from '../components/ActionSidebar';
import { fetchResidences } from '../api/api'; // ✅ On utilise le helper
import './Home.css';


export default function Home() {
  const [residences, setResidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = { role: 'owner' }; // À remplacer plus tard avec l'auth réelle

  useEffect(() => {
    const loadResidences = async () => {
      try {
        const data = await fetchResidences(); // ✅ appel via helper
        setResidences(data);
      } catch (err) {
        setError('Erreur de chargement des résidences');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadResidences();
  }, []);

  return (
    <main 
      className="container"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        position: 'relative',
        minHeight: '100vh'
      }}
    >
      {/* Overlay pour améliorer la lisibilité */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 1
        }}
      />
      
      {/* Contenu par-dessus l'overlay */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <section className="hero">
          <h1 className="hero-title">
            Trouvez des résidences<br />meublées à Abidjan
          </h1>
          <SearchForm />
        </section>

        <div className="content-grid">
          {loading ? (
            <p>Chargement...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : (
            <ResidenceList residences={residences} user={user} />
          )}

          <aside className="sidebar">
            <MapCard />
            <ActionSidebar />
          </aside>
        </div>
      </div>
    </main>
  );
}