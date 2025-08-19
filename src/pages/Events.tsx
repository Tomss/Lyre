import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Star, Music, ChevronRight, X } from 'lucide-react';

// Interfaces pour la typage des données
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

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming' ou 'past'
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Récupérer les concerts publics
  const fetchPublicEvents = async () => {
    setLoading(true);
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
  
  // Séparer les événements futurs et passés
  const upcomingEvents = events.filter(event => new Date(event.event_date) > new Date()).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  const pastEvents = events.filter(event => new Date(event.event_date) <= new Date()).sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
  
  const openEventModal = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const closeEventModal = () => {
    setIsModalOpen(false);
    // Petite temporisation pour l'animation de sortie
    setTimeout(() => setSelectedEvent(null), 300);
  };

  const displayedEvents = filter === 'upcoming' ? upcomingEvents : pastEvents;

  return (
    <div className="font-inter pt-20">
      {/* Modal détails événement */}
      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={closeEventModal}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={closeEventModal} className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                  <X className="h-6 w-6" />
              </button>
              <h2 className="font-poppins font-bold text-3xl text-dark mb-6">{selectedEvent.title}</h2>
              <div className="space-y-4 text-gray-700">
                  <div className="flex items-start space-x-4"><Calendar className="h-6 w-6 text-primary flex-shrink-0 mt-1"/> <p>{formatDate(selectedEvent.event_date).fullDate} à {formatDate(selectedEvent.event_date).time}</p></div>
                  {selectedEvent.location && <div className="flex items-start space-x-4"><MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1"/> <p>{selectedEvent.location}</p></div>}
                  {selectedEvent.orchestras.length > 0 && <div className="flex items-start space-x-4"><Users className="h-6 w-6 text-primary flex-shrink-0 mt-1"/> <p>{selectedEvent.orchestras.map(o => o.name).join(', ')}</p></div>}
                  {selectedEvent.description && <p className="mt-6 pt-6 border-t border-gray-200">{selectedEvent.description}</p>}
              </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 via-amber-25 to-yellow-25">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h1 className="font-poppins font-bold text-4xl md:text-5xl text-dark mb-6">Nos Événements</h1>
            <p className="font-inter text-lg text-gray-600 max-w-2xl mx-auto">
              Découvrez notre calendrier de concerts et rejoignez-nous pour ces moments musicaux exceptionnels.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Filtres */}
            <div className="flex items-center justify-center space-x-4 mb-12">
                <button onClick={() => setFilter('upcoming')} className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 shadow-lg ${filter === 'upcoming' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                    <Star className="h-4 w-4" />
                    <span>À venir ({upcomingEvents.length})</span>
                </button>
                <button onClick={() => setFilter('past')} className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 shadow-lg ${filter === 'past' ? 'bg-gradient-to-r from-gray-500 to-slate-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                    <Clock className="h-4 w-4" />
                    <span>Passés ({pastEvents.length})</span>
                </button>
            </div>

            {loading ? (
                 <div className="text-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div><p className="mt-4 text-gray-600">Chargement des événements...</p></div>
            ) : displayedEvents.length === 0 ? (
                <div className="text-center py-8 max-w-2xl mx-auto">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-poppins font-semibold text-2xl text-dark">{filter === 'upcoming' ? 'Aucun événement à venir' : 'Aucun événement passé pour le moment'}</h3>
                    <p className="text-gray-600 mt-2">{filter === 'upcoming' ? 'Notre programmation est en cours, revenez bientôt !' : 'Consultez nos prochains concerts.'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayedEvents.map((event, index) => {
                        const dateInfo = formatDate(event.event_date);
                        return (
                            <div key={event.id} onClick={() => openEventModal(event)} className="cursor-pointer group animate-fade-in bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300" style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="font-semibold text-primary">{dateInfo.weekday}</p>
                                            <p className="text-3xl font-bold text-dark">{dateInfo.day}</p>
                                            <p className="text-gray-500">{dateInfo.month} {dateInfo.year}</p>
                                        </div>
                                        <div className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1"><Music className="h-3 w-3"/><span>CONCERT</span></div>
                                    </div>
                                    <h3 className="font-poppins font-bold text-xl text-dark mb-3 h-14 line-clamp-2">{event.title}</h3>
                                    <div className="space-y-3 text-sm text-gray-700">
                                        <div className="flex items-center space-x-2"><Clock className="h-4 w-4 text-gray-400" /><span>{dateInfo.time}</span></div>
                                        {event.location && <div className="flex items-center space-x-2"><MapPin className="h-4 w-4 text-gray-400" /><span>{event.location}</span></div>}
                                        {event.orchestras.length > 0 && <div className="flex items-center space-x-2"><Users className="h-4 w-4 text-gray-400" /><span className="truncate">{event.orchestras.map(o => o.name).join(', ')}</span></div>}
                                    </div>
                                    <div className="text-right mt-4 text-primary font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">Voir détails →</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
      </section>
    </div>
  );
};

export default Events;