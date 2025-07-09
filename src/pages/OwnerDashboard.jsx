import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Ownerdaschboard.css';

export default function OwnerDashboard() {
  const [residences, setResidences] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('residences');
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

  // Mémoiser user et token pour éviter les re-renders
  const token = useMemo(() => localStorage.getItem('token'), []);
  const user = useMemo(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }, []);

  useEffect(() => {
    let isMounted = true; // Pour éviter les setState sur un composant démonté

    const fetchData = async () => {
      if (!user || user.role !== 'owner') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Utiliser Promise.all pour faire les requêtes en parallèle
        const [resRes, reservationsRes, statsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/residences', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/reservations/owner', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/reservations/stats/owner', {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        if (isMounted) {
          // Filtrer les résidences du propriétaire
          const ownerResidences = resRes.data.filter(r => r.owner === user._id);
          setResidences(ownerResidences);
          setReservations(reservationsRes.data);
          setStats(statsRes.data);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Erreur lors du chargement des données:', error);
          // Optionnel: gérer l'erreur d'authentification
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function pour éviter les fuites mémoire
    return () => {
      isMounted = false;
    };
  }, []); // Dépendances vides - exécute une seule fois

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Supprimer cette résidence ?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/residences/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setResidences(residences.filter((r) => r._id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleReservationStatus = async (reservationId, newStatus) => {
    try {
      // Vérifier si le token existe
      if (!token) {
        alert('Vous devez être connecté pour effectuer cette action');
        navigate('/login');
        return;
      }

      console.log('Tentative de mise à jour du statut:', { reservationId, newStatus });
      console.log('Token utilisé:', token ? 'Token présent' : 'Token manquant');

      const response = await axios.patch(
        `http://localhost:5000/api/reservations/${reservationId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('Réponse du serveur:', response.data);

      setReservations(reservations.map(reservation => 
        reservation._id === reservationId 
          ? { ...reservation, status: newStatus }
          : reservation
      ));

      alert(`Réservation ${newStatus === 'confirmée' ? 'confirmée' : 'refusée'} avec succès`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      
      if (error.response) {
        console.error('Détails de l\'erreur:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        switch (error.response.status) {
          case 401:
            alert('Session expirée. Veuillez vous reconnecter.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
            break;
          case 403:
            alert('Vous n\'avez pas les permissions pour modifier cette réservation.');
            break;
          case 404:
            alert('Réservation non trouvée.');
            break;
          default:
            alert(`Erreur serveur: ${error.response.data?.message || 'Erreur inconnue'}`);
        }
      } else {
        alert('Erreur de connexion au serveur');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmée': return '#28a745';
      case 'annulée': return '#dc3545';
      case 'en attente': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmée': return '✅';
      case 'annulée': return '❌';
      case 'en attente': return '⏳';
      default: return '❓';
    }
  };

  // Filtrer les réservations selon le statut
  const filteredReservations = filterStatus === 'all' 
    ? reservations 
    : reservations.filter(r => r.status === filterStatus);

  // Vérifier si l'utilisateur est bien propriétaire
  if (!user || user.role !== 'owner') {
    return (
      <div className="dashboard">
        <p>Accès refusé. Vous devez être connecté en tant que propriétaire.</p>
        <Link to="/login">Se connecter</Link>
      </div>
    );
  }

  if (loading) {
    return <div className="dashboard"><p>Chargement...</p></div>;
  }

  return (
    <div className="dashboard">
      <h2>Tableau de bord Propriétaire</h2>

      {/* Navigation par onglets */}
      <div className="tabs-navigation">
        <button 
          className={`tab-button ${activeTab === 'residences' ? 'active' : ''}`}
          onClick={() => setActiveTab('residences')}
        >
          🏠 Mes Résidences ({residences.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          📅 Réservations ({reservations.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistiques
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'residences' && (
        <div className="tab-content">
          <div style={{ marginBottom: '1rem' }}>
            <Link to="/residence/new" className="btn btn-primary">
              ➕ Ajouter une résidence
            </Link>
          </div>

          {residences.length === 0 ? (
            <p>Vous n'avez encore publié aucune résidence.</p>
          ) : (
            <div className="residences-grid">
              {residences.map((res) => (
                <div key={res._id} className="residence-card">
                  <div className="residence-image">
                    {res.media && res.media.length > 0 ? (
                      <img 
                        src={`http://localhost:5000${res.media[0].url}`} 
                        alt={res.title}
                        className="residence-thumbnail"
                      />
                    ) : (
                      <div className="no-image">📷</div>
                    )}
                  </div>
                  <div className="residence-info">
                    <h4>{res.title}</h4>
                    <p className="location">📍 {res.location}</p>
                    <p className="price">{(res.prixParNuit || res.price || 0).toLocaleString()} FCFA/nuit</p>
                  </div>
                  <div className="residence-actions">
                    <Link to={`/residence/edit/${res._id}`} className="btn btn-edit">
                      ✏️ Modifier
                    </Link>
                    <button onClick={() => handleDelete(res._id)} className="btn btn-delete">
                      🗑 Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reservations' && (
        <div className="tab-content">
          {/* Filtres pour les réservations */}
          <div className="reservations-filters">
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Toutes les réservations</option>
              <option value="en attente">En attente</option>
              <option value="confirmée">Confirmées</option>
              <option value="annulée">Annulées</option>
            </select>
          </div>

          {filteredReservations.length === 0 ? (
            <p>Aucune réservation {filterStatus !== 'all' ? `avec le statut "${filterStatus}"` : ''} pour le moment.</p>
          ) : (
            <div className="reservations-list">
              {filteredReservations.map((reservation) => (
                <div key={reservation._id} className="reservation-card">
                  <div className="reservation-header">
                    <div className="reservation-status">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(reservation.status) }}
                      >
                        {getStatusIcon(reservation.status)} {reservation.status}
                      </span>
                    </div>
                    <div className="reservation-date">
                      {formatDate(reservation.createdAt)}
                    </div>
                  </div>

                  <div className="reservation-details">
                    <div className="residence-info">
                      <h4>{reservation.residence?.title || 'Résidence supprimée'}</h4>
                      <p>📍 {reservation.residence?.location}</p>
                    </div>

                    <div className="client-info">
                      <h5>👤 Client</h5>
                      <p>{reservation.user?.name || 'Client inconnu'}</p>
                      <p>📧 {reservation.user?.email}</p>
                    </div>

                    <div className="stay-info">
                      <h5>📅 Séjour</h5>
                      <p>Du {formatDate(reservation.startDate)} au {formatDate(reservation.endDate)}</p>
                      <p>Durée: {Math.ceil((new Date(reservation.endDate) - new Date(reservation.startDate)) / (1000 * 60 * 60 * 24))} nuits</p>
                    </div>

                    <div className="price-info">
                      <h5>💰 Prix</h5>
                      <p className="total-price">{reservation.totalPrice?.toLocaleString()} FCFA</p>
                    </div>
                  </div>

                  {reservation.status === 'en attente' && (
                    <div className="reservation-actions">
                      <button 
                        className="btn btn-success"
                        onClick={() => handleReservationStatus(reservation._id, 'confirmée')}
                      >
                        ✅ Confirmer
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleReservationStatus(reservation._id, 'annulée')}
                      >
                        ❌ Refuser
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="tab-content">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>📊 Réservations Totales</h3>
              <p className="stat-number">{stats.totalReservations || 0}</p>
            </div>
            <div className="stat-card">
              <h3>✅ Confirmées</h3>
              <p className="stat-number">{stats.confirmedReservations || 0}</p>
            </div>
            <div className="stat-card">
              <h3>⏳ En Attente</h3>
              <p className="stat-number">{stats.pendingReservations || 0}</p>
            </div>
            <div className="stat-card">
              <h3>❌ Annulées</h3>
              <p className="stat-number">{stats.cancelledReservations || 0}</p>
            </div>
            <div className="stat-card revenue">
              <h3>💰 Revenus Totaux</h3>
              <p className="stat-number">{(stats.totalRevenue || 0).toLocaleString()} FCFA</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}