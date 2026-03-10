import React from 'react';
import PageHero from '../components/PageHero';
import { API_URL } from '../config';
import { useTheme } from '../context/ThemeContext';
import { Calendar, Clock, MapPin, Users, Star, ChevronRight, X } from 'lucide-react';

// --- Ajout des types pour la cohérence du projet et corriger les erreurs implicites ---
interface Orchestra {
  id: string;
  name: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  orchestras: Orchestra[];
}
// --- Fin de l'ajout des types ---

const Events = () => {
  const { pageHeaders } = useTheme();
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('upcoming'); // 'upcoming' ou 'past'
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Récupérer les concerts publics depuis notre nouveau backend
  const fetchPublicEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/public-events`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data || []);
      } else {
        throw new Error('Failed to fetch events');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des événements:', err);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchPublicEvents();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('fr-FR', { month: 'short' }),
      year: date.getFullYear(),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      weekday: date.toLocaleDateString('fr-FR', { weekday: 'long' }),
      fullDate: date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
  };

  const isUpcoming = (dateString: string) => new Date(dateString) > new Date();
  const isPast = (dateString: string) => new Date(dateString) <= new Date();

  // Séparer les événements futurs et passés
  const upcomingEvents = events.filter(event => isUpcoming(event.event_date)).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  const pastEvents = events.filter(event => isPast(event.event_date)).sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  const openEventModal = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const closeEventModal = () => {
    setSelectedEvent(null);
    setIsModalOpen(false);
  };

  return (
    <div>
      {/* Modal détails événement */}
      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200">
            <div className="flex justify-end">
              <button onClick={closeEventModal} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
            </div>
            <div className="p-4">
              <h2 className="font-poppins font-bold text-3xl mb-4 text-slate-800">{selectedEvent.title}</h2>
              <div className="flex items-center space-x-4 mb-6 text-sm text-slate-500">
                <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {formatDate(selectedEvent.event_date).fullDate}</span>
                {selectedEvent.location && <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {selectedEvent.location}</span>}
              </div>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">{selectedEvent.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat bg-slate-900"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.7)), url("${pageHeaders['events'] || "https://images.pexels.com/photos/1327430/pexels-photo-1327430.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"}")`
        }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in relative z-10">
            <h1 className="font-poppins font-bold text-4xl md:text-5xl text-white mb-6 drop-shadow-2xl tracking-tight">
              Nos Événements
            </h1>

            {loading ? (
              <div className="flex items-center justify-center space-x-3 text-white/90">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-teal-400/30 border-t-teal-400"></div>
                <span>Chargement de notre calendrier musical...</span>
              </div>
            ) : (
              <p className="font-inter text-base text-slate-200 max-w-2xl mx-auto leading-relaxed">
                {events.length > 0 ? 'Découvrez notre calendrier de concerts et rejoignez-nous pour ces moments musicaux exceptionnels' : 'Notre calendrier musical se prépare... Revenez bientôt pour découvrir nos prochains concerts !'}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* --- Contenu Principal --- */}
      {loading ? (
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center space-x-4 bg-white rounded-2xl p-8 shadow-xl border border-slate-100">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-100 border-t-teal-500"></div>
                <div>
                  <h3 className="font-poppins font-semibold text-xl text-slate-800 mb-2">Préparation du spectacle...</h3>
                  <p className="text-slate-500">Chargement de notre calendrier musical</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : events.length === 0 ? (
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="bg-white rounded-3xl p-12 shadow-2xl border border-slate-100 max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <Calendar className="h-12 w-12 text-slate-400" />
                </div>
                <h2 className="font-poppins font-bold text-3xl text-slate-800 mb-4">Le rideau se lève bientôt...</h2>
                <p className="font-inter text-lg text-slate-600 leading-relaxed">
                  Notre équipe artistique prépare actuellement la programmation de nos prochains concerts. Revenez bientôt pour découvrir les dates de nos représentations !
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>

          {/* Calendrier Musical Amélioré */}
          <section className="py-20 bg-slate-50 relative overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <div className="inline-block mb-8">
                    <div className="flex items-center justify-center space-x-4 mb-6">
                      <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-teal-500 to-teal-500"></div>
                      <Calendar className="h-8 w-8 text-teal-500 animate-pulse" />
                      <div className="w-16 h-0.5 bg-gradient-to-l from-transparent via-teal-500 to-teal-500"></div>
                    </div>
                  </div>
                  <h2 className="font-poppins font-bold text-5xl md:text-6xl text-slate-800 mb-6">
                    Calendrier Musical
                  </h2>
                  <p className="font-inter text-lg text-slate-600 leading-relaxed">
                    Découvrez notre programmation artistique dans un calendrier interactif élégant
                  </p>

                  {/* Filtres discrets intégrés */}
                  {events.length > 0 && (
                    <div className="flex items-center justify-center space-x-3 mt-8">
                      <button
                        onClick={() => setFilter('upcoming')}
                        className={`inline-flex items-center space-x-2 px-6 py-3 rounded-2xl font-medium transition-all duration-300 border ${filter === 'upcoming'
                          ? 'bg-teal-600 text-white border-teal-500 shadow-lg shadow-teal-500/25'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                          }`}
                      >
                        <Star className="h-4 w-4" />
                        <span>À venir ({upcomingEvents.length})</span>
                      </button>
                      <button
                        onClick={() => setFilter('past')}
                        className={`inline-flex items-center space-x-2 px-6 py-3 rounded-2xl font-medium transition-all duration-300 border ${filter === 'past'
                          ? 'bg-slate-600 text-white border-slate-500 shadow-lg shadow-slate-500/25'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                          }`}
                      >
                        <Clock className="h-4 w-4" />
                        <span>Passés ({pastEvents.length})</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                  {/* Header du calendrier premium */}
                  <div className="bg-slate-800 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full -translate-y-32 translate-x-20"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full translate-y-24 -translate-x-16"></div>

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                          <Calendar className="h-8 w-8 text-teal-400" />
                        </div>
                        <div>
                          <h3 className="font-poppins font-bold text-xl mb-1 text-white">Nos Rendez-vous</h3>
                          <p className="text-slate-400 text-sm">La musique se vit ensemble</p>
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                          <div className="text-3xl font-bold text-white">
                            {filter === 'upcoming' ? upcomingEvents.length : pastEvents.length}
                          </div>
                          <div className="text-sm text-slate-300">
                            Concert{(filter === 'upcoming' ? upcomingEvents.length : pastEvents.length) > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Corps du calendrier premium */}
                  <div className="p-8 bg-slate-50/50">
                    {(filter === 'upcoming' ? upcomingEvents : pastEvents).length > 0 ? (
                      <div className="space-y-6">
                        {(filter === 'upcoming' ? upcomingEvents : pastEvents).slice(0, 5).map((event, index) => {
                          const dateInfo = formatDate(event.event_date);
                          const isNext = index === 0 && filter === 'upcoming';
                          const isSecond = index === 1;
                          const isPastEvent = filter === 'past';

                          return (
                            <div
                              key={event.id}
                              className={`group relative overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer border ${isNext && !isPastEvent
                                ? 'bg-white border-teal-200 shadow-md ring-1 ring-teal-100'
                                : 'bg-white border-slate-200'
                                }`}
                              onClick={() => openEventModal(event)}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 p-6 relative z-10">
                                {/* Date stylisée */}
                                <div className={`flex-shrink-0 text-center p-4 rounded-xl shadow-sm w-20 sm:w-24 mx-auto sm:mx-0 ${isNext && !isPastEvent
                                  ? 'bg-teal-50 text-teal-700 border border-teal-100'
                                  : 'bg-slate-50 text-slate-600 border border-slate-100'
                                  }`}>
                                  <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-75">
                                    {dateInfo.month}
                                  </div>
                                  <div className="text-2xl sm:text-3xl font-bold leading-none mb-1">
                                    {dateInfo.day}
                                  </div>
                                  <div className="text-xs opacity-75 font-medium">
                                    {dateInfo.year}
                                  </div>
                                </div>

                                {/* Détails de l'événement */}
                                <div className="flex-1 min-w-0 text-center sm:text-left">
                                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                                    <h4 className={`font-poppins font-bold text-xl ${isNext && !isPastEvent ? 'text-slate-900' : 'text-slate-800'
                                      }`}>
                                      {event.title}
                                    </h4>
                                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                                      {isNext && (
                                        <span className="bg-teal-100 text-teal-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                                          PROCHAIN
                                        </span>
                                      )}
                                      {isSecond && !isPastEvent && (
                                        <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-medium">
                                          Bientôt
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {event.description && (
                                    <p className="text-slate-500 mb-3 text-sm leading-relaxed line-clamp-2 text-center sm:text-left">
                                      {event.description}
                                    </p>
                                  )}

                                  <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm">
                                    <div className="flex items-center space-x-2 text-slate-500 justify-center sm:justify-start">
                                      <Clock className="h-4 w-4 text-slate-400" />
                                      <span className="font-medium">{dateInfo.weekday} • {dateInfo.time}</span>
                                    </div>
                                    {event.location && (
                                      <div className="flex items-center space-x-2 text-slate-500 justify-center sm:justify-start">
                                        <MapPin className="h-4 w-4 text-slate-400" />
                                        <span className="font-medium">{event.location}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Orchestres et action */}
                                <div className="flex-shrink-0 text-center sm:text-right">
                                  {event.orchestras.length > 0 && (
                                    <div className="mb-3">
                                      <div className="flex items-center justify-center sm:justify-end space-x-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-full border border-slate-100">
                                        <Users className="h-3 w-3" />
                                        <span className="font-medium">
                                          {event.orchestras[0].name}
                                          {event.orchestras.length > 1 && ` +${event.orchestras.length - 1}`}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-center sm:justify-end space-x-2 text-teal-600 group-hover:text-teal-700 transition-colors">
                                    <span className="text-sm font-medium">Voir détails</span>
                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {(filter === 'upcoming' ? upcomingEvents : pastEvents).length > 5 && (
                          <div className="text-center pt-6">
                            <div className="inline-block px-6 py-3 bg-white border border-slate-200 rounded-full text-sm text-slate-500 shadow-sm">
                              +{(filter === 'upcoming' ? upcomingEvents : pastEvents).length - 5} autre{(filter === 'upcoming' ? upcomingEvents : pastEvents).length - 5 > 1 ? 's' : ''} concert{(filter === 'upcoming' ? upcomingEvents : pastEvents).length - 5 > 1 ? 's' : ''}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="bg-slate-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                          <Calendar className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="font-poppins font-bold text-lg text-slate-700 mb-2">Calendrier en préparation</h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto">
                          Revenez bientôt pour découvrir nos dates !
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

        </>
      )}

    </div>
  );
};

export default Events;
