import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Settings, LogOut, Users, Music, Music2, Calendar, Image } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, profile, logout } = useAuth();
  const [userInstruments, setUserInstruments] = React.useState([]);
  const [userOrchestras, setUserOrchestras] = React.useState([]);
  const [userEvents, setUserEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Récupérer les instruments de l'utilisateur
  const fetchUserInstruments = async (userId) => {
    if (!userId) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-instruments?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserInstruments(data || []);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des instruments:', err);
    }
  };

  // Récupérer les orchestres de l'utilisateur
  const fetchUserOrchestras = async (userId) => {
    if (!userId) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-orchestras?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserOrchestras(data || []);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des orchestres:', err);
    }
  };

  // Récupérer les événements de l'utilisateur
  const fetchUserEvents = async (userId: string) => {
    if (!userId) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-events?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filtrer les événements futurs et prendre les 3 prochains
        const futureEvents = data.filter(event => new Date(event.event_date) > new Date());
        const sortedEvents = futureEvents.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
        setUserEvents(sortedEvents.slice(0, 3));
      } else {
        console.error('Failed to fetch events:', response.status);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des événements:', err);
    }
  };
  React.useEffect(() => {
    if (user && user.id) {
      Promise.all([
        fetchUserInstruments(user.id), 
        fetchUserOrchestras(user.id), 
        fetchUserEvents(user.id)
      ]).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);
  if (!user) {
    return <Navigate to="/connexion" />;
  }

  return (
    <div className="font-inter pt-20 pb-20 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              {profile ? (
                <>
                  <h1 className="font-poppins font-bold text-3xl text-dark mb-2">
                    Bonjour {profile.first_name} {profile.last_name}
                  </h1>
                  <p className="font-inter text-lg text-gray-600">
                    Bienvenue dans votre espace.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="font-poppins font-bold text-3xl text-dark mb-2">
                    Bonjour
                  </h1>
                  <p className="font-inter text-lg text-gray-600">
                    Chargement de votre profil...
                  </p>
                </>
              )}
              {user && profile && (
                <p className="font-inter text-sm text-gray-500 mt-2">
                  Connecté en tant que {user.email} • Rôle: {profile.role}
                </p>
              )}
            </div>
            <div className="mt-6 md:mt-0">
              <button
                onClick={logout}
                className="inline-flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-dark font-medium px-4 py-2 rounded-lg transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Admin Section - Visible uniquement pour les Admins */}
        {(profile?.role === 'Admin' || profile?.role === 'Gestionnaire') && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-8 mb-8">
            <h2 className="font-poppins font-semibold text-xl text-dark mb-4">
              Administration
            </h2>
            <p className="font-inter text-gray-600 mb-6">
              Accédez aux outils d'administration de l'école.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {profile?.role === 'Admin' && (
                <Link
                  to="/admin/users"
                  className="inline-flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg text-center justify-center"
                >
                  <Users className="h-5 w-5" />
                  <span>Utilisateurs</span>
                </Link>
              )}
              {profile?.role === 'Admin' && (
                <Link
                  to="/admin/instruments"
                  className="inline-flex items-center space-x-2 bg-accent hover:bg-accent/90 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg text-center justify-center"
                >
                  <Music className="h-5 w-5" />
                  <span>Instruments</span>
                </Link>
              )}
              {profile?.role === 'Admin' && (
                <Link
                  to="/admin/orchestras"
                  className="inline-flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg text-center justify-center"
                >
                  <Users className="h-5 w-5" />
                  <span>Orchestres</span>
                </Link>
              )}
              {profile?.role === 'Admin' && (
                <Link
                  to="/admin/events"
                  className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg text-center justify-center"
                >
                  <Calendar className="h-5 w-5" />
                  <span>Événements</span>
                </Link>
              )}
              <Link
                to="/admin/media"
                className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg text-center justify-center"
              >
                <Image className="h-5 w-5" />
                <span>Médias</span>
              </Link>
            </div>
          </div>
        )}

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-br from-indigo-400 to-purple-500 p-2 rounded-lg shadow-md">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-poppins font-semibold text-lg text-dark">
                Mon Profil
              </h3>
            </div>
            <p className="font-inter text-gray-600 mb-4">
              Gérez vos informations personnelles et vos préférences.
            </p>
            <button className="text-primary hover:text-primary/80 font-medium text-sm transition-colors">
              Modifier mon profil →
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-br from-teal-400 to-cyan-500 p-2 rounded-lg shadow-md">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-poppins font-semibold text-lg text-dark">
                Mes Cours
              </h3>
            </div>
            <p className="font-inter text-gray-600 mb-4">
              Consultez vos cours et votre planning.
            </p>
            <button className="text-primary hover:text-primary/80 font-medium text-sm transition-colors">
              Voir mes cours →
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-2 rounded-lg shadow-md">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-poppins font-semibold text-lg text-dark">
                Mes Prochains Événements
              </h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              </div>
            ) : userEvents.length > 0 ? (
              <div className="space-y-3">
                {userEvents.map((event, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border-l-4 border-green-600">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-inter font-medium text-gray-800 text-sm">{event.title}</h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        event.event_type === 'concert' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {event.event_type === 'concert' ? 'Concert' : 'Répétition'}
                      </span>
                    </div>
                    <p className="font-inter text-xs text-gray-500">
                      {new Date(event.event_date).toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {event.location && ` • ${event.location}`}
                    </p>
                  </div>
                ))}
                <button className="w-full text-green-600 hover:text-green-700 font-medium text-sm transition-colors mt-3 py-2 border border-green-200 rounded-lg hover:bg-green-50">
                  <Link to="/user/events" className="block w-full">
                    Voir tous mes événements →
                  </Link>
                </button>
              </div>
            ) : (
              <p className="font-inter text-gray-500 text-sm">
                Aucun événement à venir pour le moment.
              </p>
            )}
          </div>
        </div>

        {/* User Instruments and Orchestras */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* My Instruments */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-2 rounded-lg shadow-md">
                <Music className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-poppins font-semibold text-lg text-dark">
                Mes Instruments
              </h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : userInstruments.length > 0 ? (
              <div className="space-y-2">
                {userInstruments.map((instrument, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                    <Music2 className="h-4 w-4 text-accent" />
                    <span className="font-inter text-gray-700">{instrument.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-inter text-gray-500 text-sm">
                Aucun instrument assigné pour le moment.
              </p>
            )}
          </div>

          {/* My Orchestras */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-br from-rose-400 to-pink-500 p-2 rounded-lg shadow-md">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-poppins font-semibold text-lg text-dark">
                Mes Orchestres
              </h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : userOrchestras.length > 0 ? (
              <div className="space-y-2">
                {userOrchestras.map((orchestra, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-inter font-medium text-gray-800">{orchestra.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-inter text-gray-500 text-sm">
                Aucun orchestre assigné pour le moment.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;