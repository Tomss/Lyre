import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Search, X, Filter, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

// Interfaces
interface Orchestra {
  id: string;
  name: string;
  description?: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  practical_info: string | null;
  event_type: 'concert' | 'repetition' | 'reunion' | 'autre';
  event_date: string;
  location: string | null;
  orchestras: Orchestra[];
}

const getOrchestraColor = (name: string) => {
  const colors = [
    'bg-teal-100 text-teal-800 border-teal-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-sky-100 text-sky-800 border-sky-200',
    'bg-cyan-100 text-cyan-800 border-cyan-200',
    'bg-slate-100 text-slate-800 border-slate-200',
    'bg-emerald-100 text-emerald-800 border-emerald-200'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const UserEvents = () => {
  const { isAuthenticated, token } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [userOrchestras, setUserOrchestras] = useState<Orchestra[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // const [typeFilter, setTypeFilter] = useState<string[]>(['concert', 'repetition', 'reunion', 'autre']); // Removed global type filter in favor of sectioned view
  const [orchestraFilter, setOrchestraFilter] = useState<string[]>([]);

  // Collapsible states
  const [isConcertsOpen, setIsConcertsOpen] = useState(true);
  const [isRehearsalsOpen, setIsRehearsalsOpen] = useState(true);
  const [isPastOpen, setIsPastOpen] = useState(false);

  // Expanded practical info state
  const [expandedInfo, setExpandedInfo] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isAuthenticated && token) {
      const fetchUserEvents = async () => {
        setLoading(true);
        try {
          const response = await fetch(`${API_URL}/user/events`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch user events');
          }

          const data: Event[] = await response.json();
          setEvents(data || []);

          const orchestras = new Map<string, Orchestra>();
          data.forEach(event => {
            event.orchestras.forEach(orchestra => {
              if (!orchestras.has(orchestra.id)) {
                orchestras.set(orchestra.id, orchestra);
              }
            });
          });
          const uniqueOrchestras = Array.from(orchestras.values());
          setUserOrchestras(uniqueOrchestras);
          setOrchestraFilter(uniqueOrchestras.map(o => o.id));

        } catch (err) {
          console.error('Erreur lors de la recuperation des evenements de l utilisateur:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchUserEvents();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

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
      case 'concert': return 'bg-teal-100 text-teal-800 border border-teal-200';
      case 'repetition': return 'bg-slate-100 text-slate-800 border border-slate-200';
      case 'reunion': return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'concert': return Calendar;
      case 'repetition': return Clock;
      case 'reunion': return Users;
      default: return Calendar;
    }
  };

  const toggleOrchestraFilter = (orchestraId: string) => {
    setOrchestraFilter(prev =>
      prev.includes(orchestraId)
        ? prev.filter(id => id !== orchestraId)
        : [...prev, orchestraId]
    );
  };

  const selectAllOrchestras = () => {
    setOrchestraFilter(userOrchestras.map(o => o.id));
  };

  const clearAllOrchestras = () => {
    setOrchestraFilter([]);
  };

  const toggleInfo = (eventId: string) => {
    const newSet = new Set(expandedInfo);
    if (newSet.has(eventId)) {
      newSet.delete(eventId);
    } else {
      newSet.add(eventId);
    }
    setExpandedInfo(newSet);
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

    // const matchesType = typeFilter.length === 0 || typeFilter.includes(event.event_type);

    const matchesOrchestra = orchestraFilter.length === 0 ||
      event.orchestras.some(o => orchestraFilter.includes(o.id));

    return matchesSearch && matchesOrchestra;
  });

  // Séparer les événements passés et futurs
  const now = new Date();
  const futureEvents = filteredEvents.filter(event => new Date(event.event_date) > now)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  const pastEvents = filteredEvents.filter(event => new Date(event.event_date) <= now)
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  // Split future events into Concerts and Rehearsals/Others
  const upcomingConcerts = futureEvents.filter(e => e.event_type === 'concert');
  const upcomingRehearsals = futureEvents.filter(e => e.event_type !== 'concert');

  if (!isAuthenticated && !loading) {
    return <Navigate to="/connexion" />;
  }

  const EventCard = ({ event }: { event: Event }) => {
    const TypeIcon = getTypeIcon(event.event_type);
    const hasPracticalInfo = !!event.practical_info;
    const isInfoExpanded = expandedInfo.has(event.id);

    return (
      <div className="p-6 hover:bg-slate-50 transition-colors border-b border-gray-100 last:border-0">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-full ${event.event_type === 'concert' ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-500'}`}>
            <TypeIcon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h3 className="font-semibold text-slate-800 text-lg">
                {event.title}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(event.event_type)}`}>
                <TypeIcon className="h-3 w-3 mr-1" />
                {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
              </span>
            </div>

            {event.description && (
              <p className="text-sm text-gray-600 mb-3">
                {event.description}
              </p>
            )}

            {/* Practical Info Toggle */}
            {hasPracticalInfo && (
              <div className="mb-3">
                <button
                  onClick={() => toggleInfo(event.id)}
                  className="flex items-center space-x-2 text-sm font-medium text-teal-600 hover:text-teal-700 focus:outline-none transition-colors"
                >
                  <Info className="h-4 w-4" />
                  <span>Infos Pratiques</span>
                  {isInfoExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>

                {isInfoExpanded && (
                  <div className="mt-2 p-4 bg-teal-50/50 border border-teal-100 rounded-lg animate-fade-in text-sm text-slate-700">
                    {event.practical_info}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
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
              <div className="flex flex-wrap gap-2">
                {event.orchestras.map(o => (
                  <span
                    key={o.id}
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getOrchestraColor(o.name)}`}
                  >
                    <Users className="h-3 w-3 mr-1.5" />
                    {o.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="font-inter pt-20 lg:pt-40 pb-20 min-h-screen bg-slate-50/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link
                to="/dashboard"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors mr-2"
                title="Retour au dashboard"
              >
                <ArrowLeft className="h-6 w-6 text-slate-600" />
              </Link>
              <div className="bg-teal-50 p-3 rounded-lg">
                <Calendar className="h-8 w-8 text-teal-600" />
              </div>
              <div>
                <h1 className="font-poppins font-bold text-3xl text-slate-800">
                  Tous mes événements
                </h1>
                <p className="font-inter text-slate-500">
                  Concerts et répétitions de vos orchestres
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-slate-500 mt-4">
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Recherche */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full lg:w-64"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>

            {/* Filtre par orchestre */}
            <div className="flex items-center space-x-6">
              {userOrchestras.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-500 mr-2">Orchestres:</span>
                  {userOrchestras.map((orchestra) => (
                    <button
                      key={orchestra.id}
                      onClick={() => toggleOrchestraFilter(orchestra.id)}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${orchestraFilter.includes(orchestra.id)
                          ? 'bg-teal-50 text-teal-700 border-teal-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      {orchestra.name}
                    </button>
                  ))}
                  <div className="flex items-center space-x-1 text-xs ml-2 border-l border-slate-200 pl-2">
                    <button onClick={selectAllOrchestras} className="text-teal-600 hover:text-teal-700">Tout</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={clearAllOrchestras} className="text-slate-500 hover:text-slate-700">Aucun</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-2 text-slate-600">Chargement de vos événements...</p>
          </div>
        ) : filteredEvents.length === 0 && searchTerm ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
            <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p>Aucun événement trouvé pour "{searchTerm}"</p>
            <button onClick={() => setSearchTerm('')} className="text-teal-600 hover:text-teal-700 mt-2">Effacer la recherche</button>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p>Aucun événement trouvé</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Section Concerts à venir */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button
                onClick={() => setIsConcertsOpen(!isConcertsOpen)}
                className="w-full flex items-center justify-between p-6 bg-teal-50/50 hover:bg-teal-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-teal-100 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-teal-700" />
                  </div>
                  <h2 className="font-poppins font-semibold text-xl text-slate-800">
                    Prochains Concerts
                  </h2>
                  <span className="bg-teal-200 text-teal-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {upcomingConcerts.length}
                  </span>
                </div>
                {isConcertsOpen ? <ChevronUp className="text-teal-600" /> : <ChevronDown className="text-teal-600" />}
              </button>

              {isConcertsOpen && (
                <div className="divide-y divide-gray-100">
                  {upcomingConcerts.length > 0 ? (
                    upcomingConcerts.map(event => <EventCard key={event.id} event={event} />)
                  ) : (
                    <div className="p-8 text-center text-slate-500 italic">
                      Aucun concert à venir pour le moment.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section Répétitions et Autres à venir */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button
                onClick={() => setIsRehearsalsOpen(!isRehearsalsOpen)}
                className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-slate-200 p-2 rounded-lg">
                    <Clock className="h-5 w-5 text-slate-700" />
                  </div>
                  <h2 className="font-poppins font-semibold text-xl text-slate-800">
                    Répétitions & Autres
                  </h2>
                  <span className="bg-slate-200 text-slate-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {upcomingRehearsals.length}
                  </span>
                </div>
                {isRehearsalsOpen ? <ChevronUp className="text-slate-600" /> : <ChevronDown className="text-slate-600" />}
              </button>

              {isRehearsalsOpen && (
                <div className="divide-y divide-gray-100">
                  {upcomingRehearsals.length > 0 ? (
                    upcomingRehearsals.map(event => <EventCard key={event.id} event={event} />)
                  ) : (
                    <div className="p-8 text-center text-slate-500 italic">
                      Aucune répétition ou autre événement à venir.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section Événements passés */}
            {pastEvents.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden opacity-90">
                <button
                  onClick={() => setIsPastOpen(!isPastOpen)}
                  className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-200 p-2 rounded-lg">
                      <Clock className="h-5 w-5 text-gray-600" />
                    </div>
                    <h2 className="font-poppins font-semibold text-xl text-gray-700">
                      Événements Passés
                    </h2>
                    <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {pastEvents.length}
                    </span>
                  </div>
                  {isPastOpen ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
                </button>

                {isPastOpen && (
                  <div className="divide-y divide-gray-100">
                    {pastEvents.map(event => <EventCard key={event.id} event={event} />)}
                  </div>
                )}
              </div>
            )}

            {/* Message si aucun événement après filtrage */}
            {futureEvents.length === 0 && pastEvents.length === 0 && filteredEvents.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
                <Filter className="h-12 w-12 text-slate-300 mx-auto mb-4" />
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