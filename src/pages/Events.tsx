import React from 'react';
import { Calendar, Clock, MapPin, Users, Star, Music, ChevronRight, X } from 'lucide-react';

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
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('upcoming'); // 'upcoming' ou 'past'
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Récupérer les concerts publics
  const fetchPublicEvents = async () => {
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
    <div className="font-inter">
      {/* Modal détails événement */}
      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-end">
                <button onClick={closeEventModal} className="p-2 text-gray-500 hover:text-gray-800"><X size={24} /></button>
            </div>
            <div className="p-4">
                <h2 className="font-poppins font-bold text-2xl mb-4">{selectedEvent.title}</h2>
                <p className="text-gray-600">{selectedEvent.description}</p>
                {/* Vous pouvez ajouter plus de détails ici si nécessaire */}
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <section className="relative py-32 bg-cover bg-center bg-no-repeat bg-gray-900" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("https://images.pexels.com/photos/1327430/pexels-photo-1327430.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop")` 
        }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in relative z-10 pt-16">
            <div className="inline-flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-white/30 shadow-lg">
              <Music className="h-6 w-6 text-white" />
              <span className="text-white font-semibold">Nos événements musicaux</span>
            </div>
            <h1 className="font-poppins font-bold text-4xl md:text-5xl text-white mb-6">Nos Événements</h1>
            {loading ? (
              <div className="flex items-center justify-center space-x-3 text-white/80">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white"></div>
                <span>Chargement de notre calendrier musical...</span>
              </div>
            ) : (
              <p className="font-inter text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
                {events.length > 0 ? 'Découvrez notre calendrier de concerts et rejoignez-nous pour ces moments musicaux exceptionnels' : 'Notre calendrier musical se prépare... Revenez bientôt pour découvrir nos prochains concerts !'}
              </p>
            )}
            
            {/* Filtres */}
            {!loading && events.length > 0 && (
              <div className="flex items-center justify-center space-x-4 mt-8">
                <button
                  onClick={() => setFilter('upcoming')}
                  className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 shadow-lg ${filter === 'upcoming' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 'bg-white/90 text-gray-700 hover:bg-white hover:text-gray-800'}`}
                >
                  <Star className="h-4 w-4" />
                  <span>À venir ({upcomingEvents.length})</span>
                </button>
                <button
                  onClick={() => setFilter('past')}
                  className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 shadow-lg ${filter === 'past' ? 'bg-gradient-to-r from-gray-500 to-slate-600 text-white' : 'bg-white/90 text-gray-700 hover:bg-white hover:text-gray-800'}`}
                >
                  <Clock className="h-4 w-4" />
                  <span>Passés ({pastEvents.length})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- Contenu Principal --- */}
      {loading ? (
        <section className="py-16 bg-gradient-to-br from-blue-25 via-indigo-25 to-purple-25">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center space-x-4 bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-500"></div>
                <div>
                  <h3 className="font-poppins font-semibold text-xl text-gray-800 mb-2">Préparation du spectacle...</h3>
                  <p className="text-gray-600">Chargement de notre calendrier musical</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : events.length === 0 ? (
        <section className="py-16 bg-gradient-to-br from-blue-25 via-indigo-25 to-purple-25">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-3xl p-12 shadow-2xl border border-orange-200 max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-slate-400 to-gray-500 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8 shadow-lg">
                  <Calendar className="h-12 w-12 text-white" />
                </div>
                <h2 className="font-poppins font-bold text-3xl text-gray-800 mb-4">Le rideau se lève bientôt...</h2>
                <p className="font-inter text-lg text-gray-600 leading-relaxed">
                  Notre équipe artistique prépare actuellement la programmation de nos prochains concerts. Revenez bientôt pour découvrir les dates de nos représentations !
                </p>
                <div className="mt-8 flex justify-center"><div className="flex space-x-2">{[...Array(3)].map((_, i) => (<div key={i} className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />))}</div></div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Événements à venir */}
          {filter === 'upcoming' && (
            upcomingEvents.length > 0 ? (
              <>
              <section className="py-16 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-12"><h2 className="font-poppins font-bold text-3xl text-gray-800 mb-6">Nos Prochains Événements</h2></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {upcomingEvents.map((event, index) => {
                      const dateInfo = formatDate(event.event_date);
                      return (
                        <div key={event.id} onClick={() => openEventModal(event)} className="group animate-fade-in cursor-pointer" style={{ animationDelay: `${index * 0.1}s` }}>
                          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                            <div className="bg-gradient-to-r from-slate-600 to-gray-700 p-4 text-white relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-full -translate-y-6 translate-x-6"></div><div className="absolute bottom-0 left-0 w-10 h-10 bg-white/10 rounded-full translate-y-5 -translate-x-5"></div>
                              <div className="relative z-10">
                                <div className="flex items-center justify-between mb-3"><div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2"><span className="text-sm font-semibold">Concert</span></div><div className="text-right"><div className="text-2xl font-bold">{dateInfo.day}</div><div className="text-sm opacity-90">{dateInfo.month} {dateInfo.year}</div></div></div>
                                <h3 className="font-poppins font-bold text-lg mb-1 group-hover:scale-105 transition-transform duration-300 line-clamp-2">{event.title}</h3>
                                <div className="text-gray-200 text-sm">{dateInfo.weekday} • {dateInfo.time}</div>
                              </div>
                            </div>
                            <div className="p-4 space-y-4">
                                {event.location && <div className="flex items-center space-x-3 text-gray-500"><div className="bg-gray-100 p-2 rounded-lg"><MapPin className="h-4 w-4" /></div><span className="font-medium text-sm">{event.location}</span></div>}
                                {event.orchestras.length > 0 && <div className="flex items-center space-x-3 text-gray-500"><div className="bg-gray-100 p-2 rounded-lg"><Users className="h-4 w-4" /></div><span className="font-medium text-sm">{event.orchestras.map(o => o.name).join(', ')}</span></div>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Calendrier résumé */}
              <section className="py-12 bg-gradient-to-br from-slate-25 via-gray-25 to-blue-25">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className="font-poppins font-bold text-2xl text-gray-800 mb-3">
                        📅 Calendrier Musical
                      </h2>
                      <p className="text-gray-600">Aperçu de nos prochaines dates</p>
                    </div>
                    
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/60 overflow-hidden">
                      {/* Header du calendrier */}
                      <div className="bg-gradient-to-r from-slate-600 via-gray-600 to-slate-700 p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                              <Calendar className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-poppins font-bold text-xl">Prochains Rendez-vous</h3>
                              <p className="text-gray-200 text-sm">Ne manquez aucun de nos concerts</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
                            <div className="text-sm text-gray-200">Concert{upcomingEvents.length > 1 ? 's' : ''}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Corps du calendrier */}
                      <div className="p-6">
                        {upcomingEvents.length > 0 ? (
                          <div className="space-y-4">
                            {upcomingEvents.slice(0, 4).map((event, index) => {
                              const dateInfo = formatDate(event.event_date);
                              const isNext = index === 0;
                              
                              return (
                                <div 
                                  key={event.id} 
                                  className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 hover:shadow-md ${
                                    isNext 
                                      ? 'bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 shadow-sm' 
                                      : 'bg-gray-25 hover:bg-gray-50 border border-gray-100'
                                  }`}
                                >
                                  {/* Date */}
                                  <div className={`flex-shrink-0 text-center p-3 rounded-xl ${
                                    isNext 
                                      ? 'bg-gradient-to-br from-slate-600 to-gray-700 text-white shadow-lg' 
                                      : 'bg-white border-2 border-gray-200 text-gray-700'
                                  }`}>
                                    <div className="text-xs font-medium opacity-80 uppercase tracking-wide">
                                      {dateInfo.month}
                                    </div>
                                    <div className="text-2xl font-bold leading-none">
                                      {dateInfo.day}
                                    </div>
                                    <div className="text-xs opacity-80">
                                      {dateInfo.year}
                                    </div>
                                  </div>
                                  
                                  {/* Détails */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <h4 className={`font-poppins font-semibold truncate ${
                                        isNext ? 'text-slate-800 text-lg' : 'text-gray-800'
                                      }`}>
                                        {event.title}
                                      </h4>
                                      {isNext && (
                                        <span className="bg-gradient-to-r from-slate-600 to-gray-700 text-white text-xs px-2 py-1 rounded-full font-medium">
                                          Prochain
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                      <div className="flex items-center space-x-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{dateInfo.time}</span>
                                      </div>
                                      {event.location && (
                                        <div className="flex items-center space-x-1">
                                          <MapPin className="h-3 w-3" />
                                          <span className="truncate">{event.location}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Orchestres */}
                                  {event.orchestras.length > 0 && (
                                    <div className="flex-shrink-0">
                                      <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                        <Users className="h-3 w-3" />
                                        <span className="truncate max-w-24">
                                          {event.orchestras[0].name}
                                          {event.orchestras.length > 1 && ` +${event.orchestras.length - 1}`}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            
                            {upcomingEvents.length > 4 && (
                              <div className="text-center pt-4 border-t border-gray-100">
                                <span className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
                                  +{upcomingEvents.length - 4} autre{upcomingEvents.length - 4 > 1 ? 's' : ''} concert{upcomingEvents.length - 4 > 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                              <Calendar className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">Calendrier en préparation</p>
                            <p className="text-gray-400 text-sm mt-1">Nos prochaines dates seront bientôt annoncées</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              </>
            ) : (
              <section className="py-16 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-xl border border-white/50 max-w-2xl mx-auto">
                      <div className="bg-gradient-to-br from-slate-400 to-gray-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg"><Star className="h-10 w-10 text-white" /></div>
                      <h2 className="font-poppins font-bold text-2xl text-gray-800 mb-4">Aucun concert à venir</h2>
                      <p className="font-inter text-gray-600 leading-relaxed">Notre programmation est en cours de préparation. Revenez bientôt pour découvrir nos prochains concerts !</p>
                    </div>
                  </div>
                </div>
              </section>
            )
          )}

          {/* Calendrier Musical Amélioré */}
          <section className="py-20 bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900 relative overflow-hidden">
            {/* Particules d'arrière-plan */}
            <div className="absolute inset-0">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-orange-400/20 rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
            
            {/* Formes géométriques décoratives */}
            <div className="absolute top-10 left-10 w-32 h-32 border border-orange-400/10 rounded-full"></div>
            <div className="absolute bottom-20 right-20 w-24 h-24 border-2 border-slate-600/30 rounded-lg rotate-45"></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-br from-orange-400/5 to-amber-500/5 rounded-full"></div>
            
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <div className="inline-block mb-8">
                    <div className="flex items-center justify-center space-x-4 mb-6">
                      <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-orange-400"></div>
                      <div className="bg-gradient-to-br from-orange-400 to-amber-500 p-4 rounded-2xl shadow-2xl">
                        <Calendar className="h-10 w-10 text-white animate-pulse" />
                      </div>
                      <div className="w-16 h-0.5 bg-gradient-to-l from-transparent via-orange-400 to-orange-400"></div>
                    </div>
                  </div>
                  <h2 className="font-poppins font-bold text-5xl md:text-6xl text-white mb-6 bg-gradient-to-r from-orange-200 via-amber-200 to-orange-200 bg-clip-text text-transparent">
                    📅 Calendrier Musical
                  </h2>
                  <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                    Découvrez notre programmation artistique dans un calendrier interactif élégant
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-white/95 via-gray-50/95 to-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                  {/* Header du calendrier premium */}
                  <div className="bg-gradient-to-r from-slate-800 via-gray-700 to-slate-800 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-orange-400/5 rounded-full -translate-y-20 translate-x-20"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-400/5 rounded-full translate-y-16 -translate-x-16"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/5 rounded-full"></div>
                    
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                          <Calendar className="h-8 w-8 text-orange-300" />
                        </div>
                        <div>
                          <h3 className="font-poppins font-bold text-2xl mb-2">Nos Rendez-vous Musicaux</h3>
                          <p className="text-gray-300 text-lg">Chaque note compte, chaque moment est unique</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl p-4 shadow-xl">
                          <div className="text-3xl font-bold text-white">{upcomingEvents.length}</div>
                          <div className="text-sm text-orange-100">Concert{upcomingEvents.length > 1 ? 's' : ''}</div>
                          <div className="text-sm text-orange-100">à venir</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Corps du calendrier premium */}
                  <div className="p-8">
                    {upcomingEvents.length > 0 ? (
                      <div className="space-y-6">
                        {upcomingEvents.slice(0, 5).map((event, index) => {
                          const dateInfo = formatDate(event.event_date);
                          const isNext = index === 0;
                          const isSecond = index === 1;
                          
                          return (
                            <div 
                              key={event.id} 
                              className={`group relative overflow-hidden rounded-2xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer ${
                                isNext 
                                  ? 'bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-2 border-orange-200 shadow-xl scale-105' 
                                  : isSecond
                                  ? 'bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 shadow-lg'
                                  : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-md'
                              }`}
                              onClick={() => openEventModal(event)}
                            >
                              {/* Effet de brillance au survol */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                              
                              <div className="flex items-center space-x-6 p-6 relative z-10">
                                {/* Date stylisée */}
                                <div className={`flex-shrink-0 text-center p-4 rounded-2xl shadow-lg ${
                                  isNext 
                                    ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-orange-200' 
                                    : isSecond
                                    ? 'bg-gradient-to-br from-slate-600 to-gray-700 text-white shadow-slate-200'
                                    : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 border-2 border-gray-300'
                                }`}>
                                  <div className="text-xs font-bold opacity-90 uppercase tracking-wider mb-1">
                                    {dateInfo.month}
                                  </div>
                                  <div className="text-3xl font-bold leading-none mb-1">
                                    {dateInfo.day}
                                  </div>
                                  <div className="text-xs opacity-90 font-medium">
                                    {dateInfo.year}
                                  </div>
                                </div>
                                
                                {/* Détails de l'événement */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-3 mb-3">
                                    <h4 className={`font-poppins font-bold text-xl truncate ${
                                      isNext ? 'text-orange-800' : isSecond ? 'text-slate-800' : 'text-gray-800'
                                    }`}>
                                      {event.title}
                                    </h4>
                                    {isNext && (
                                      <div className="flex items-center space-x-2">
                                        <span className="bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg animate-pulse">
                                          🎵 PROCHAIN
                                        </span>
                                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
                                      </div>
                                    )}
                                    {isSecond && (
                                      <span className="bg-gradient-to-r from-slate-600 to-gray-700 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md">
                                        Bientôt
                                      </span>
                                    )}
                                  </div>
                                  
                                  {event.description && (
                                    <p className="text-gray-600 mb-3 text-sm leading-relaxed line-clamp-2">
                                      {event.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex items-center space-x-6 text-sm">
                                    <div className="flex items-center space-x-2 text-gray-500">
                                      <div className={`p-1.5 rounded-lg ${isNext ? 'bg-orange-100' : 'bg-gray-100'}`}>
                                        <Clock className="h-4 w-4" />
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/50">
              <div className="bg-gradient-to-br from-slate-500 to-gray-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8 shadow-lg"><Music className="h-10 w-10 text-white" /></div>
              <h2 className="font-poppins font-bold text-3xl text-gray-800 mb-6">Rejoignez-nous</h2>
              <p className="font-inter text-base text-gray-600 leading-relaxed mb-6">
                Chaque concert est une nouvelle page de notre histoire musicale. Venez partager ces moments d'émotion et de partage avec La Lyre Cheminote et Municipale de Chalindrey.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="text-center"><div className="bg-gradient-to-br from-slate-100 to-gray-100 rounded-2xl p-6 mb-4"><Calendar className="h-8 w-8 text-slate-600 mx-auto mb-3" /><h3 className="font-semibold text-gray-800">Concerts réguliers</h3><p className="text-sm text-gray-600 mt-2">Plusieurs représentations par an</p></div></div>
                <div className="text-center"><div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-6 mb-4"><Users className="h-8 w-8 text-indigo-600 mx-auto mb-3" /><h3 className="font-semibold text-gray-800">Tous niveaux</h3><p className="text-sm text-gray-600 mt-2">De l'éveil au niveau supérieur</p></div></div>
                <div className="text-center"><div className="bg-gradient-to-br from-blue-100 to-slate-100 rounded-2xl p-6 mb-4"><Music className="h-8 w-8 text-blue-600 mx-auto mb-3" /><h3 className="font-semibold text-gray-800">Répertoire varié</h3><p className="text-sm text-gray-600 mt-2">Classique, moderne, populaire</p></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Events;