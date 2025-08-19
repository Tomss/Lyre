import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Music, Search, X, Filter } from 'lucide-react';

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

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>(['concert', 'repetition']);

  // Récupérer tous les événements publics (concerts)
  const fetchEvents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-events?type=public`, {
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
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

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
    
    return matchesSearch && matchesType;
  });

  // Séparer les événements futurs et passés
  const now = new Date();
  const futureEvents = filteredEvents.filter(event => new Date(event.event_date) > now)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  const pastEvents = filteredEvents.filter(event => new Date(event.event_date) <= now)
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  return (
    <div className="font-inter">
      {/* Header Section */}
      <section className="relative py-32 bg-cover bg-center bg-no-repeat bg-gray-900" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop")` 
        }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in relative z-10 pt-16">
            <h1 className="font-poppins font-bold text-4xl md:text-5xl text-white mb-6">
              Nos événements musicaux.
            </h1>
            {loading ? (
              <p className="font-inter text-lg text-white/80 max-w-2xl mx-auto">
                Chargement de nos événements...
              </p>
            ) : events.length > 0 ? (
              <p className="font-inter text-lg text-white/90 max-w-2xl mx-auto">
                Découvrez nos concerts et répétitions !
              </p>
            ) : (
              <p className="font-inter text-lg text-white/90 max-w-2xl mx-auto">
                Nos événements seront bientôt disponibles. Revenez nous voir !
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Filtres et recherche */}
      {events.length > 0 && (
        <section className="py-6 bg-gradient-to-r from-blue-25 to-indigo-25 border-b border-white/50 sticky top-20 z-40 shadow-sm backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col space-y-4">
              {/* Recherche */}
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher un événement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full text-base shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* Filtres par type */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700 mr-2">Types :</span>
                  {[
                    { key: 'concert', label: 'Concerts', icon: Calendar, color: 'green' },
                    { key: 'repetition', label: 'Répétitions', icon: Clock, color: 'blue' }
                  ].map(({ key, label, icon: Icon, color }) => (
                    <button
                      key={key}
                      onClick={() => toggleTypeFilter(key)}
                      className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 ${
                        typeFilter.includes(key)
                          ? (
                              color === 'green' ? 'bg-green-600 text-white shadow-lg border-2 border-green-700' :
                              color === 'blue' ? 'bg-blue-600 text-white shadow-lg border-2 border-blue-700' :
                              'bg-gray-600 text-white shadow-lg border-2 border-gray-700'
                            )
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                
                {/* Compteur de résultats */}
                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                  {filteredEvents.length} résultat{filteredEvents.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Événements à venir */}
      {futureEvents.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-emerald-25 via-teal-25 to-cyan-25">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 animate-fade-in">
              <h2 className="font-poppins font-bold text-3xl md:text-4xl text-dark mb-4">
                🎵 Événements à venir
              </h2>
              <p className="font-inter text-lg text-gray-600 max-w-2xl mx-auto">
                Ne manquez pas nos prochains concerts et répétitions
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {futureEvents.map((event) => {
                const TypeIcon = getTypeIcon(event.event_type);
                return (
                  <div key={event.id} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in group">
                    <div className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-gradient-to-br from-teal-400 to-cyan-500 p-2 rounded-lg shadow-md">
                          <TypeIcon className="h-6 w-6 text-white" />
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(event.event_type)}`}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {event.event_type === 'concert' ? 'Concert' : 'Répétition'}
                        </span>
                      </div>
                      
                      <h3 className="font-poppins font-semibold text-xl text-dark mb-3">
                        {event.title}
                      </h3>
                      
                      {event.description && (
                        <p className="font-inter text-gray-600 mb-4 text-sm leading-relaxed">
                          {event.description}
                        </p>
                      )}
                      
                      <div className="space-y-2 text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-teal-500" />
                          <span>{formatDate(event.event_date)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-teal-500" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.orchestras && event.orchestras.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-teal-500" />
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
        </section>
      )}

      {/* Événements passés */}
      {pastEvents.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-gray-25 via-slate-25 to-blue-25">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 animate-fade-in">
              <h2 className="font-poppins font-bold text-3xl md:text-4xl text-dark mb-4">
                📅 Événements passés
              </h2>
              <p className="font-inter text-lg text-gray-600 max-w-2xl mx-auto">
                Revivez nos derniers concerts et répétitions
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pastEvents.map((event) => {
                const TypeIcon = getTypeIcon(event.event_type);
                return (
                  <div key={event.id} className="bg-white/60 backdrop-blur-sm rounded-xl shadow-md border border-white/50 overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in opacity-75">
                    <div className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-gray-300 p-2 rounded-lg">
                          <TypeIcon className="h-6 w-6 text-gray-600" />
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(event.event_type)} opacity-75`}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {event.event_type === 'concert' ? 'Concert' : 'Répétition'}
                        </span>
                      </div>
                      
                      <h3 className="font-poppins font-semibold text-xl text-gray-700 mb-3">
                        {event.title}
                      </h3>
                      
                      {event.description && (
                        <p className="font-inter text-gray-500 mb-4 text-sm leading-relaxed">
                          {event.description}
                        </p>
                      )}
                      
                      <div className="space-y-2 text-sm text-gray-400 mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(event.event_date)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.orchestras && event.orchestras.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
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
        </section>
      )}

      {/* Message si aucun événement */}
      {loading ? (
        <section className="py-20 bg-gradient-to-br from-blue-25 via-indigo-25 to-purple-25">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center animate-fade-in">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement de nos événements...</p>
            </div>
          </div>
        </section>
      ) : filteredEvents.length === 0 && searchTerm ? (
        <section className="py-20 bg-gradient-to-br from-blue-25 via-indigo-25 to-purple-25">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center animate-fade-in">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Aucun événement trouvé pour "{searchTerm}"</p>
              <button onClick={() => setSearchTerm('')} className="text-primary hover:text-primary/80">Effacer la recherche</button>
            </div>
          </div>
        </section>
      ) : events.length === 0 ? (
        <section className="py-20 bg-gradient-to-br from-blue-25 via-indigo-25 to-purple-25">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center animate-fade-in">
              <div className="bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Calendar className="h-16 w-16 text-white" />
              </div>
              <h2 className="font-poppins font-semibold text-2xl text-dark mb-4">
                Nos événements arrivent bientôt !
              </h2>
              <p className="font-inter text-gray-600 max-w-md mx-auto">
                Notre équipe travaille actuellement sur la programmation de nos prochains concerts et répétitions. 
                Revenez bientôt pour les découvrir !
              </p>
            </div>
          </div>
        </section>
      ) : filteredEvents.length === 0 ? (
        <section className="py-20 bg-gradient-to-br from-blue-25 via-indigo-25 to-purple-25">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center animate-fade-in">
              <Filter className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucun événement ne correspond aux filtres sélectionnés</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default Events;