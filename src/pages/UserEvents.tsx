import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Search, X, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: 'concert' | 'repetition';
  event_date: string;
  location: string | null;
  orchestras: Orchestra[];
}

interface Orchestra {
  id: string;
  name: string;
  description?: string;
}

const UserEvents = () => {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [userOrchestras, setUserOrchestras] = useState<Orchestra[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>(['concert', 'repetition']);
  const [orchestraFilter, setOrchestraFilter] = useState<string[]>([]);

  // Récupérer les orchestres de l'utilisateur
  const fetchUserOrchestras = async (userId: string) => {
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
        // Initialiser le filtre orchestre avec tous les orchestres de l'utilisateur
        setOrchestraFilter(data.map((o: Orchestra) => o.id) || []);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des orchestres:', err);
    }
  };

  // Récupérer tous les événements de l'utilisateur
  const fetchUserEvents = async (userId: string) => {
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
        setEvents(data || []);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des événements:', err);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      Promise.all([
        fetchUserOrchestras(user.id),
        fetchUserEvents(user.id)
      ]).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'concert': return 'bg-green-100 text-green-800';
      case 'repetition': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'concert': return Calendar;
      case 'repetition': return Clock;
      default: return Calendar;
    }
  };

  const toggleTypeFilter = (type: string) => {
    setTypeFilter(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleOrchestraFilter = (orchestraId: string) => {
    setOrchestraFilter(prev => 
      prev.includes(orchestraId) 
        ? prev.filter(id => id !== orchestraId)
        : [...prev, orchestraId]
    );
  };

  const selectAllTypes = () => {
    setTypeFilter(['concert', 'repetition']);
  };

  const clearAllTypes = () => {
    setTypeFilter([]);
  };

  const selectAllOrchestras = () => {
    setOrchestraFilter(userOrchestras.map(o => o.id));
  };

  const clearAllOrchestras = () => {
    setOrchestraFilter([]);
  };

  // Filtrer les événements
  const filteredEvents = events.filter(event => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      event.title.toLowerCase().includes(searchLower) ||
      (event.description && event.description.toLowerCase().includes(searchLower)) ||
      (event.location && event.location.toLowerCase().includes(searchLower)) ||
      event.orchestras.some(o => o.name.toLowerCase().includes(searchLower))
    );
    
    const matchesType = typeFilter.includes(event.event_type);
    
    const matchesOrchestra = orchestraFilter.length === 0 || 
      event.orchestras.some(o => orchestraFilter.includes(o.id));
    
    return matchesSearch && matchesType && matchesOrchestra;
  });

  // Séparer les événements passés et futurs
  const now = new Date();
  const futureEvents = filteredEvents.filter(event => new Date(event.event_date) > now)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  const pastEvents = filteredEvents.filter(event => new Date(event.event_date) <= now)
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  if (!user) {
    return <Navigate to="/connexion" />;
  }

  return (
    <div className="font-inter pt-20 pb-20 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link
                to="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-2"
                title="Retour au dashboard"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </Link>
              <div className="bg-green-600/10 p-3 rounded-lg">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="font-poppins font-bold text-3xl text-dark">
                  Tous mes événements
                </h1>
                <p className="font-inter text-gray-600">
                  Concerts et répétitions de vos orchestres
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-4">
            <span className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''} {searchTerm && `sur ${events.length}`}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{userOrchestras.length} orchestre{userOrchestras.length > 1 ? 's' : ''}</span>
            </span>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Recherche */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 w-64"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Filtres */}
            <div className="flex items-center space-x-6">
              {/* Filtre par type */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleTypeFilter('concert')}
                    className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      typeFilter.includes('concert')
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <Calendar className="h-3 w-3" />
                    <span>Concerts</span>
                  </button>
                  <button
                    onClick={() => toggleTypeFilter('repetition')}
                    className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      typeFilter.includes('repetition')
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    <span>Répétitions</span>
                  </button>
                </div>
                <div className="flex items-center space-x-1 text-xs">
                  <button onClick={selectAllTypes} className="text-green-600 hover:text-green-700">Tout</button>
                  <span className="text-gray-300">|</span>
                  <button onClick={clearAllTypes} className="text-gray-500 hover:text-gray-700">Aucun</button>
                </div>
              </div>

              {/* Filtre par orchestre */}
              {userOrchestras.length > 1 && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {userOrchestras.map((orchestra) => (
                      <button
                        key={orchestra.id}
                        onClick={() => toggleOrchestraFilter(orchestra.id)}
                        className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                          orchestraFilter.includes(orchestra.id)
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        <Users className="h-3 w-3" />
                        <span>{orchestra.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center space-x-1 text-xs">
                    <button onClick={selectAllOrchestras} className="text-primary hover:text-primary/80">Tout</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={clearAllOrchestras} className="text-gray-500 hover:text-gray-700">Aucun</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement de vos événements...</p>
          </div>
        ) : filteredEvents.length === 0 && searchTerm ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>Aucun événement trouvé pour "{searchTerm}"</p>
            <button onClick={() => setSearchTerm('')} className="text-green-600 hover:text-green-700 mt-2">Effacer la recherche</button>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>Aucun événement trouvé</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Événements à venir */}
            {futureEvents.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-green-50">
                  <h2 className="font-poppins font-semibold text-xl text-dark flex items-center space-x-2">
                    <Calendar className="h-6 w-6 text-green-600" />
                    <span>Événements à venir ({futureEvents.length})</span>
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {futureEvents.map((event) => {
                    const TypeIcon = getTypeIcon(event.event_type);
                    return (
                      <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start space-x-4">
                          <div className="bg-green-600/10 p-3 rounded-full">
                            <TypeIcon className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-dark text-lg">
                                {event.title}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(event.event_type)}`}>
                                <TypeIcon className="h-3 w-3 mr-1" />
                                {event.event_type === 'concert' ? 'Concert' : 'Répétition'}
                              </span>
                            </div>
                            
                            {event.description && (
                              <p className="text-sm text-gray-600 mb-3">
                                {event.description}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(event.event_date)}</span>
                              </span>
                              {event.location && (
                                <span className="flex items-center space-x-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{event.location}</span>
                                </span>
                              )}
                            </div>
                            
                            {event.orchestras && event.orchestras.length > 0 && (
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Users className="h-3 w-3" />
                                <span>{event.orchestras.map(o => o.name).join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Événements passés */}
            {pastEvents.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                  <h2 className="font-poppins font-semibold text-xl text-dark flex items-center space-x-2">
                    <Clock className="h-6 w-6 text-gray-600" />
                    <span>Événements passés ({pastEvents.length})</span>
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {pastEvents.map((event) => {
                    const TypeIcon = getTypeIcon(event.event_type);
                    return (
                      <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors opacity-75">
                        <div className="flex items-start space-x-4">
                          <div className="bg-gray-100 p-3 rounded-full">
                            <TypeIcon className="h-6 w-6 text-gray-500" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-gray-700 text-lg">
                                {event.title}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(event.event_type)} opacity-75`}>
                                <TypeIcon className="h-3 w-3 mr-1" />
                                {event.event_type === 'concert' ? 'Concert' : 'Répétition'}
                              </span>
                            </div>
                            
                            {event.description && (
                              <p className="text-sm text-gray-500 mb-3">
                                {event.description}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(event.event_date)}</span>
                              </span>
                              {event.location && (
                                <span className="flex items-center space-x-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{event.location}</span>
                                </span>
                              )}
                            </div>
                            
                            {event.orchestras && event.orchestras.length > 0 && (
                              <div className="flex items-center space-x-1 text-xs text-gray-400">
                                <Users className="h-3 w-3" />
                                <span>{event.orchestras.map(o => o.name).join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Message si aucun événement après filtrage */}
            {futureEvents.length === 0 && pastEvents.length === 0 && filteredEvents.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p>Aucun événement ne correspond aux filtres sélectionnés</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserEvents;