import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Filter, Search } from 'lucide-react';

// Types pour les événements
interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: 'concert' | 'repetition';
  event_date: string;
  location?: string;
  orchestras: string[];
}

// Données d'exemple
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Concert de Printemps',
    description: 'Un magnifique concert pour célébrer l\'arrivée du printemps avec des œuvres classiques et contemporaines.',
    event_type: 'concert',
    event_date: '2024-03-15T20:00:00Z',
    location: 'Salle des Fêtes de la Ville',
    orchestras: ['Orchestre Principal', 'Ensemble de Chambre']
  },
  {
    id: '2',
    title: 'Répétition Générale',
    description: 'Dernière répétition avant le grand concert.',
    event_type: 'repetition',
    event_date: '2024-03-10T19:00:00Z',
    location: 'Salle de Répétition',
    orchestras: ['Orchestre Principal']
  },
  {
    id: '3',
    title: 'Concert d\'Été',
    description: 'Concert en plein air dans le parc municipal.',
    event_type: 'concert',
    event_date: '2024-06-21T19:30:00Z',
    location: 'Parc Municipal',
    orchestras: ['Orchestre Principal', 'Orchestre des Jeunes']
  }
];

function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<'all' | 'concerts' | 'repetitions' | 'upcoming'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulation du chargement des données
    setTimeout(() => {
      setEvents(mockEvents);
      setLoading(false);
    }, 1000);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location?.toLowerCase().includes(searchTerm.toLowerCase());

    switch (filter) {
      case 'concerts':
        return event.event_type === 'concert' && matchesSearch;
      case 'repetitions':
        return event.event_type === 'repetition' && matchesSearch;
      case 'upcoming':
        return isUpcoming(event.event_date) && matchesSearch;
      default:
        return matchesSearch;
    }
  });

  const upcomingEvents = events.filter(event => isUpcoming(event.event_date)).slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des événements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      {/* Header */}
      <section className="py-16 bg-gradient-to-r from-slate-800 via-gray-800 to-slate-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
              Nos Événements
            </h1>
            <p className="text-xl text-slate-200 mb-8">
              Découvrez tous nos concerts, répétitions et événements musicaux
            </p>
            
            {/* Barre de recherche */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filtres */}
      <section className="py-8 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { key: 'upcoming', label: 'À venir', icon: Calendar },
              { key: 'all', label: 'Tous', icon: Filter },
              { key: 'concerts', label: 'Concerts', icon: Users },
              { key: 'repetitions', label: 'Répétitions', icon: Clock }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  filter === key
                    ? 'bg-slate-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-slate-50 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filter === 'upcoming' && upcomingEvents.length > 0 && (
          <>
            {/* Section Nos prochains événements */}
            <section className="py-16 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                      Nos prochains événements
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      Ne manquez aucun de nos concerts et répétitions à venir
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {upcomingEvents.map((event, index) => (
                      <div
                        key={event.id}
                        className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
                          index === 0 ? 'md:col-span-2 lg:col-span-1 ring-2 ring-indigo-200' : ''
                        }`}
                      >
                        <div className={`p-6 ${event.event_type === 'concert' ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gradient-to-r from-slate-500 to-gray-600'} text-white`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              event.event_type === 'concert' ? 'bg-white/20' : 'bg-white/20'
                            }`}>
                              {event.event_type === 'concert' ? '🎵 Concert' : '🎼 Répétition'}
                            </span>
                            {index === 0 && (
                              <span className="px-2 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                                Prochain
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                          <div className="flex items-center text-white/90 text-sm">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>{formatDate(event.event_date)}</span>
                          </div>
                        </div>

                        <div className="p-6">
                          <p className="text-gray-600 mb-4 line-clamp-3">
                            {event.description}
                          </p>

                          <div className="space-y-3">
                            <div className="flex items-center text-gray-700">
                              <Clock className="w-4 h-4 mr-3 text-gray-400" />
                              <span className="font-medium">{formatTime(event.event_date)}</span>
                            </div>

                            {event.location && (
                              <div className="flex items-center text-gray-700">
                                <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                                <span>{event.location}</span>
                              </div>
                            )}

                            <div className="flex items-center text-gray-700">
                              <Users className="w-4 h-4 mr-3 text-gray-400" />
                              <div className="flex flex-wrap gap-1">
                                {event.orchestras.map((orchestra, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
                                  >
                                    {orchestra}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Calendrier résumé */}
            <section className="py-12 bg-gradient-to-br from-slate-25 via-gray-25 to-blue-25">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header du calendrier */}
                    <div className="bg-gradient-to-r from-slate-600 via-gray-600 to-slate-700 text-white p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-8 h-8" />
                          <div>
                            <h3 className="text-2xl font-bold">Calendrier des événements</h3>
                            <p className="text-slate-200">Aperçu rapide de vos prochains rendez-vous</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold">{upcomingEvents.length}</div>
                          <div className="text-sm text-slate-200">événements à venir</div>
                        </div>
                      </div>
                    </div>

                    {/* Corps du calendrier */}
                    <div className="p-6">
                      <div className="grid gap-4">
                        {upcomingEvents.slice(0, 4).map((event, index) => (
                          <div
                            key={event.id}
                            className={`flex items-center p-4 rounded-lg border-l-4 transition-all hover:shadow-md ${
                              index === 0
                                ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-200'
                                : event.event_type === 'concert'
                                ? 'bg-blue-50 border-blue-400'
                                : 'bg-slate-50 border-slate-400'
                            }`}
                          >
                            <div className="flex-shrink-0 mr-4">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                event.event_type === 'concert' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {event.event_type === 'concert' ? '🎵' : '🎼'}
                              </div>
                            </div>

                            <div className="flex-grow">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-gray-800">{event.title}</h4>
                                {index === 0 && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                    Prochain
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  <span>{formatDate(event.event_date)}</span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  <span>{formatTime(event.event_date)}</span>
                                </div>
                                {event.location && (
                                  <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    <span className="truncate max-w-32">{event.location}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center mt-2">
                                <Users className="w-4 h-4 mr-2 text-gray-400" />
                                <div className="flex flex-wrap gap-1">
                                  {event.orchestras.slice(0, 2).map((orchestra, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                                    >
                                      {orchestra}
                                    </span>
                                  ))}
                                  {event.orchestras.length > 2 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                      +{event.orchestras.length - 2}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {upcomingEvents.length > 4 && (
                          <div className="text-center py-4">
                            <p className="text-gray-500 text-sm">
                              Et {upcomingEvents.length - 4} autres événements à venir...
                            </p>
                          </div>
                        )}

                        {upcomingEvents.length === 0 && (
                          <div className="text-center py-8">
                            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Aucun événement programmé pour le moment</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Liste des événements filtrés */}
        {filteredEvents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className={`p-6 ${event.event_type === 'concert' ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gradient-to-r from-slate-500 to-gray-600'} text-white`}>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 mb-2 inline-block">
                    {event.event_type === 'concert' ? '🎵 Concert' : '🎼 Répétition'}
                  </span>
                  <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                  <div className="flex items-center text-white/90 text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(event.event_date)}</span>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-gray-600 mb-4">
                    {event.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center text-gray-700">
                      <Clock className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="font-medium">{formatTime(event.event_date)}</span>
                    </div>

                    {event.location && (
                      <div className="flex items-center text-gray-700">
                        <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                        <span>{event.location}</span>
                      </div>
                    )}

                    <div className="flex items-center text-gray-700">
                      <Users className="w-4 h-4 mr-3 text-gray-400" />
                      <div className="flex flex-wrap gap-1">
                        {event.orchestras.map((orchestra, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
                          >
                            {orchestra}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-600 mb-4">
              Aucun événement trouvé
            </h3>
            <p className="text-gray-500 mb-8">
              {searchTerm 
                ? `Aucun événement ne correspond à "${searchTerm}"`
                : "Aucun événement ne correspond aux filtres sélectionnés"
              }
            </p>
            <button
              onClick={() => {
                setFilter('all');
                setSearchTerm('');
              }}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Voir tous les événements
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Events;