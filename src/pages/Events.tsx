import React from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

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
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="font-inter pt-20">
      {/* Header Section */}
      <section className="py-20 bg-gradient-to-r from-accent/10 to-primary/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h1 className="font-poppins font-bold text-4xl md:text-5xl text-dark mb-6">
              Nos concerts à venir.
            </h1>
            {loading ? (
              <p className="font-inter text-lg text-gray-600 max-w-2xl mx-auto">
                Chargement des événements...
              </p>
            ) : events.length > 0 ? (
              <p className="font-inter text-lg text-gray-600 max-w-2xl mx-auto">
                Découvrez nos prochains concerts et ne manquez aucun de nos événements musicaux !
              </p>
            ) : (
              <p className="font-inter text-lg text-gray-600 max-w-2xl mx-auto">
                Aucun concert programmé pour le moment. Revenez bientôt pour découvrir nos prochains événements !
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center animate-fade-in">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des événements...</p>
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <div key={event.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in">
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Concert
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
                    
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
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
              ))}
            </div>
          ) : (
            <div className="text-center animate-fade-in">
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8">
                <Calendar className="h-16 w-16 text-primary" />
              </div>
              <h2 className="font-poppins font-semibold text-2xl text-dark mb-4">
                Aucun concert programmé
              </h2>
              <p className="font-inter text-gray-600 max-w-md mx-auto">
                Notre équipe travaille actuellement sur la programmation de nos prochains concerts. 
                Revenez bientôt pour les découvrir !
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Event Categories Preview */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-8 shadow-md text-center animate-fade-in">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-poppins font-semibold text-xl text-dark mb-4">
                Concerts
              </h3>
              <p className="font-inter text-gray-600">
                Nos concerts publics mettant en avant nos élèves et professeurs.
              </p>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-md text-center animate-fade-in">
              <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-poppins font-semibold text-xl text-dark mb-4">
                Masterclasses
              </h3>
              <p className="font-inter text-gray-600">
                Des sessions spécialisées avec des musiciens professionnels invités.
              </p>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-md text-center animate-fade-in">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-poppins font-semibold text-xl text-dark mb-4">
                Événements
              </h3>
              <p className="font-inter text-gray-600">
                Des événements communautaires et des rencontres musicales.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Events;