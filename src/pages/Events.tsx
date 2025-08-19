import React from 'react';
import { Calendar, Clock, MapPin, Users, ChevronRight, Star, Music } from 'lucide-react';

const Events = () => {
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

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

  const formatDate = (dateString) => {
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

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date();
  };

  const isPast = (dateString) => {
    return new Date(dateString) <= new Date();
  };

  // Séparer les événements futurs et passés
  const upcomingEvents = events.filter(event => isUpcoming(event.event_date));
  const pastEvents = events.filter(event => isPast(event.event_date));

  return (
    <div className="font-inter pt-20 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section avec animation */}
      <section className="relative py-24 overflow-hidden">
        {/* Background animé */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600">
          <div className="absolute inset-0 bg-black/20"></div>
          {/* Particules flottantes */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white/30 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-white/30">
              <Music className="h-6 w-6 text-white animate-pulse" />
              <span className="text-white font-medium">Nos concerts à venir</span>
            </div>
            
            <h1 className="font-poppins font-bold text-5xl md:text-7xl text-white mb-6 leading-tight">
              Voyage Musical
              <span className="block text-3xl md:text-4xl text-orange-200 font-light mt-2">
                dans le temps
              </span>
            </h1>
            
            {loading ? (
              <div className="flex items-center justify-center space-x-3 text-white/80">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white"></div>
                <span>Chargement de notre calendrier musical...</span>
              </div>
            ) : events.length > 0 ? (
              <p className="font-inter text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                Découvrez notre calendrier de concerts et plongez dans l'univers musical de La Lyre
              </p>
            ) : (
              <p className="font-inter text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                Notre calendrier musical se prépare... Revenez bientôt pour découvrir nos prochains concerts !
              </p>
            )}
          </div>
        </div>
        
        {/* Vague décorative */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" className="w-full h-12 fill-slate-50">
            <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </section>

      {loading ? (
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center space-x-4 bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-500"></div>
                <div>
                  <h3 className="font-poppins font-semibold text-xl text-gray-800 mb-2">
                    Préparation du spectacle...
                  </h3>
                  <p className="text-gray-600">Chargement de notre calendrier musical</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : events.length === 0 ? (
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-3xl p-12 shadow-2xl border border-orange-200 max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8 shadow-lg">
                  <Calendar className="h-12 w-12 text-white" />
                </div>
                <h2 className="font-poppins font-bold text-3xl text-gray-800 mb-4">
                  Le rideau se lève bientôt...
                </h2>
                <p className="font-inter text-lg text-gray-600 leading-relaxed">
                  Notre équipe artistique prépare actuellement la programmation de nos prochains concerts. 
                  Revenez bientôt pour découvrir les dates de nos représentations !
                </p>
                <div className="mt-8 flex justify-center">
                  <div className="flex space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 bg-orange-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Timeline des événements à venir */}
          {upcomingEvents.length > 0 && (
            <section className="py-12 relative">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full px-6 py-3 mb-6 border border-green-200">
                    <Star className="h-5 w-5 text-green-600 animate-pulse" />
                    <span className="text-green-800 font-semibold">Prochainement</span>
                  </div>
                  <h2 className="font-poppins font-bold text-3xl text-gray-800 mb-4">
                    Nos Prochains Concerts
                  </h2>
                  <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                    Réservez vos dates pour ces moments musicaux exceptionnels
                  </p>
                </div>

                {/* Timeline verticale créative */}
                <div className="relative max-w-4xl mx-auto">
                  {/* Ligne de temps centrale */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-green-400 via-blue-400 to-purple-400 rounded-full" 
                       style={{ height: `${upcomingEvents.length * 180}px` }}>
                    {/* Pulsation en haut */}
                    <div className="absolute -top-2 -left-2 w-5 h-5 bg-green-400 rounded-full animate-ping"></div>
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>

                  {upcomingEvents.reverse().map((event, index) => {
                    const dateInfo = formatDate(event.event_date);
                    const isLeft = index % 2 === 0;
                    
                    return (
                      <div key={event.id} className={`relative flex items-center mb-12 ${isLeft ? 'justify-start' : 'justify-end'}`}>
                        {/* Point sur la timeline */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                          <div className="w-5 h-5 bg-white rounded-full border-3 border-blue-400 shadow-lg">
                            <div className="w-full h-full bg-blue-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>

                        {/* Carte d'événement */}
                        <div className={`w-5/12 ${isLeft ? 'mr-auto pr-8' : 'ml-auto pl-8'}`}>
                          <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group ${
                            isLeft ? 'animate-fade-in-left' : 'animate-fade-in-right'
                          }`}>
                            {/* Header coloré */}
                            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white relative overflow-hidden">
                              {/* Motif décoratif */}
                              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
                              
                              <div className="relative z-10">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                                    <span className="text-sm font-semibold">Concert</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold">{dateInfo.day}</div>
                                    <div className="text-sm opacity-90">{dateInfo.month} {dateInfo.year}</div>
                                  </div>
                                </div>
                                <h3 className="font-poppins font-bold text-xl mb-2 group-hover:scale-105 transition-transform duration-300">
                                  {event.title}
                                </h3>
                                <div className="text-blue-100 text-sm">
                                  {dateInfo.weekday} • {dateInfo.time}
                                </div>
                              </div>
                            </div>

                            {/* Contenu */}
                            <div className="p-4">
                              {event.description && (
                                <p className="text-gray-600 mb-4 leading-relaxed">
                                  {event.description}
                                </p>
                              )}
                              
                              <div className="space-y-3">
                                {event.location && (
                                  <div className="flex items-center space-x-3 text-gray-500">
                                    <div className="bg-gray-100 p-2 rounded-lg">
                                      <MapPin className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium">{event.location}</span>
                                  </div>
                                )}
                                
                                {event.orchestras && event.orchestras.length > 0 && (
                                  <div className="flex items-center space-x-3 text-gray-500">
                                    <div className="bg-gray-100 p-2 rounded-lg">
                                      <Users className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium">{event.orchestras.map(o => o.name).join(', ')}</span>
                                  </div>
                                )}
                              </div>

                              {/* Badge countdown */}
                              <div className="mt-4 pt-3 border-t border-gray-100">
                                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full px-4 py-2 border border-green-200">
                                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                  <span className="text-green-700 font-semibold text-sm">À venir</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Section des événements passés */}
          {pastEvents.length > 0 && (
            <section className="py-12 bg-gradient-to-br from-gray-50 to-slate-100">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-gray-100 to-slate-100 rounded-full px-6 py-3 mb-6 border border-gray-200">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-700 font-semibold">Nos souvenirs</span>
                  </div>
                  <h2 className="font-poppins font-bold text-3xl text-gray-800 mb-4">
                    Concerts Passés
                  </h2>
                  <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                    Revivez nos dernières performances musicales
                  </p>
                </div>

                {/* Grille des événements passés */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                  {pastEvents.reverse().slice(0, 6).map((event, index) => {
                    const dateInfo = formatDate(event.event_date);
                    
                    return (
                      <div key={event.id} className="group">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 opacity-75 hover:opacity-100">
                          {/* Header avec date */}
                          <div className="bg-gradient-to-r from-gray-400 to-slate-500 p-4 text-white">
                            <div className="flex items-center justify-between">
                              <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                                <span className="text-xs font-semibold">Concert</span>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold">{dateInfo.day}</div>
                                <div className="text-xs opacity-90">{dateInfo.month}</div>
                              </div>
                            </div>
                          </div>

                          {/* Contenu */}
                          <div className="p-4">
                            <h3 className="font-poppins font-semibold text-lg text-gray-800 mb-3 group-hover:text-gray-900 transition-colors">
                              {event.title}
                            </h3>
                            
                            {event.description && (
                              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                            
                            <div className="space-y-2 text-xs text-gray-500">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-3 w-3" />
                                <span>{dateInfo.fullDate}</span>
                              </div>
                              
                              {event.location && (
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-3 w-3" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {pastEvents.length > 6 && (
                  <div className="text-center mt-8">
                    <button className="inline-flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 py-4 rounded-full shadow-lg border border-gray-200 transition-all duration-300 hover:-translate-y-1">
                      <span>Voir plus de concerts</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}

      {/* Section d'information */}
      <section className="py-12 bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/50">
              <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8 shadow-lg">
                <Music className="h-10 w-10 text-white" />
              </div>
              
              <h2 className="font-poppins font-bold text-2xl text-gray-800 mb-6">
                Rejoignez notre aventure musicale
              </h2>
              
              <p className="font-inter text-base text-gray-600 leading-relaxed mb-6">
                Chaque concert est une nouvelle page de notre histoire musicale. 
                Venez partager ces moments d'émotion et de partage avec La Lyre Cheminote et Municipale de Chalindrey.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="text-center">
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-4 mb-4">
                    <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-800">Concerts réguliers</h3>
                    <p className="text-sm text-gray-600 mt-2">Plusieurs représentations par an</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-4 mb-4">
                    <Users className="h-8 w-8 text-green-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-800">Tous niveaux</h3>
                    <p className="text-sm text-gray-600 mt-2">De l'éveil au niveau supérieur</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-4 mb-4">
                    <Music className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-800">Répertoire varié</h3>
                    <p className="text-sm text-gray-600 mt-2">Classique, moderne, populaire</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Events;