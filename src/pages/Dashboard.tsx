import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Settings, LogOut, Users, Music, Music2, Calendar, Image, FileText, Download, ChevronRight, ChevronDown, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UserPartition {
  id: string;
  nom: string;
  file_path: string | null;
  file_name: string | null;
  file_type: string | null;
  morceaux: {
    id: string;
    nom: string;
    compositeur: string | null;
    arrangement: string | null;
    orchestras: Orchestra[];
  };
  instruments: {
    id: string;
    name: string;
  };
}

interface Orchestra {
  id: string;
  name: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: 'concert' | 'repetition';
  event_date: string;
  location: string | null;
  orchestras: Orchestra[];
}

const Dashboard = () => {
  const { user, profile, logout } = useAuth();
  const [userInstruments, setUserInstruments] = React.useState<any[]>([]);
  const [userOrchestras, setUserOrchestras] = React.useState<any[]>([]);
  const [userEvents, setUserEvents] = React.useState<Event[]>([]);
  const [userPartitions, setUserPartitions] = React.useState<UserPartition[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [partitionsLoading, setPartitionsLoading] = React.useState(true);
  const [expandedOrchestras, setExpandedOrchestras] = React.useState<Set<string>>(new Set());
  const [expandedMorceaux, setExpandedMorceaux] = React.useState<Set<string>>(new Set());

  // Récupérer les instruments de l'utilisateur
  const fetchUserInstruments = async (userId: string) => {
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
  const fetchUserOrchestras = async (userId: string) => {
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
        // Filtrer les événements futurs et prendre les 5 prochains
        const futureEvents = data.filter((event: Event) => new Date(event.event_date) > new Date());
        const sortedEvents = futureEvents.sort((a: Event, b: Event) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
        setUserEvents(sortedEvents.slice(0, 5));
      } else {
        console.error('Failed to fetch events:', response.status);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des événements:', err);
    }
  };

  // Récupérer les partitions de l'utilisateur
  const fetchUserPartitions = async (userId: string) => {
    if (!userId) return;
    setPartitionsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-partitions?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserPartitions(data || []);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des partitions:', err);
    }
    setPartitionsLoading(false);
  };

  React.useEffect(() => {
    if (user && user.id) {
      Promise.all([
        fetchUserInstruments(user.id), 
        fetchUserOrchestras(user.id), 
        fetchUserEvents(user.id),
        fetchUserPartitions(user.id)
      ]).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  // Grouper les partitions par orchestre, puis par morceau, puis par instrument
  const partitionsByOrchestra = React.useMemo(() => {
    const grouped: Record<string, any> = {};
    
    userPartitions.forEach(partition => {
      partition.morceaux.orchestras.forEach(orchestra => {
        if (!grouped[orchestra.id]) {
          grouped[orchestra.id] = {
            orchestra,
            morceaux: {}
          };
        }
        
        const morceauId = partition.morceaux.id;
        if (!grouped[orchestra.id].morceaux[morceauId]) {
          grouped[orchestra.id].morceaux[morceauId] = {
            morceau: partition.morceaux,
            instruments: {}
          };
        }
        
        const instrumentId = partition.instruments.id;
        if (!grouped[orchestra.id].morceaux[morceauId].instruments[instrumentId]) {
          grouped[orchestra.id].morceaux[morceauId].instruments[instrumentId] = {
            instrument: partition.instruments,
            partitions: []
          };
        }
        
        grouped[orchestra.id].morceaux[morceauId].instruments[instrumentId].partitions.push(partition);
      });
    });
    
    return grouped;
  }, [userPartitions]);

  const toggleOrchestraExpansion = (orchestraId: string) => {
    setExpandedOrchestras(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orchestraId)) {
        newSet.delete(orchestraId);
      } else {
        newSet.add(orchestraId);
      }
      return newSet;
    });
  };

  const toggleMorceauExpansion = (morceauId: string) => {
    setExpandedMorceaux(prev => {
      const newSet = new Set(prev);
      if (newSet.has(morceauId)) {
        newSet.delete(morceauId);
      } else {
        newSet.add(morceauId);
      }
      return newSet;
    });
  };

  const openPartition = (partition: UserPartition) => {
    if (partition.file_path) {
      window.open(partition.file_path, '_blank');
    }
  };

  if (!user) {
    return <Navigate to="/connexion" />;
  }

  return (
    <div className="font-inter pt-20 pb-20 min-h-screen bg-gradient-to-br from-blue-25 via-indigo-25 to-purple-25">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        
        {/* Header Section - Profil utilisateur */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 mb-8 relative overflow-hidden">
          {/* Particules décoratives */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-amber-500/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/10 to-indigo-500/10 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            {/* En-tête avec salutation et déconnexion */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8">
              <div className="mb-6 md:mb-0">
                {profile ? (
                  <>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="bg-gradient-to-br from-orange-400 to-amber-500 p-3 rounded-full shadow-lg">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h1 className="font-poppins font-bold text-3xl text-dark">
                          Bonjour {profile.first_name} {profile.last_name}
                        </h1>
                        <div className="flex items-center space-x-3 mt-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            profile.role === 'Admin' ? 'bg-red-100 text-red-800' :
                            profile.role === 'Gestionnaire' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {profile.role}
                          </span>
                          <span className="text-sm text-gray-500">• {user.email}</span>
                        </div>
                      </div>
                    </div>
                    <p className="font-inter text-lg text-gray-600 max-w-2xl">
                      Bienvenue dans votre espace personnel. Retrouvez ici vos événements, partitions et informations musicales.
                    </p>
                  </>
                ) : (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={logout}
                  className="inline-flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-dark font-medium px-6 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg border border-gray-200"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>

            {/* Informations musicales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mes Instruments */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
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
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                  </div>
                ) : userInstruments.length > 0 ? (
                  <div className="space-y-2">
                    {userInstruments.map((instrument, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-amber-200/50">
                        <Music2 className="h-5 w-5 text-amber-600" />
                        <span className="font-inter font-medium text-gray-800">{instrument.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-inter text-gray-600 text-sm bg-white/40 p-3 rounded-lg">
                    Aucun instrument assigné pour le moment.
                  </p>
                )}
              </div>

              {/* Mes Orchestres */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-gradient-to-br from-blue-400 to-indigo-500 p-2 rounded-lg shadow-md">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-poppins font-semibold text-lg text-dark">
                    Mes Orchestres
                  </h3>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                ) : userOrchestras.length > 0 ? (
                  <div className="space-y-2">
                    {userOrchestras.map((orchestra, index) => (
                      <div key={index} className="p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-blue-200/50">
                        <div className="flex items-center space-x-3">
                          <Users className="h-5 w-5 text-blue-600" />
                          <span className="font-inter font-medium text-gray-800">{orchestra.name}</span>
                        </div>
                        {orchestra.description && (
                          <p className="text-xs text-gray-600 mt-2 ml-8 line-clamp-2">
                            {orchestra.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-inter text-gray-600 text-sm bg-white/40 p-3 rounded-lg">
                    Aucun orchestre assigné pour le moment.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Section - Visible uniquement pour les Admins et Gestionnaires */}
        {(profile?.role === 'Admin' || profile?.role === 'Gestionnaire') && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 mb-8 relative overflow-hidden">
            {/* Effet décoratif */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-red-400/10 to-pink-500/10 rounded-full -translate-y-20 translate-x-20"></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gradient-to-br from-red-500 to-pink-600 p-3 rounded-full shadow-lg">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="font-poppins font-bold text-2xl text-dark">
                    Administration
                  </h2>
                  <p className="font-inter text-gray-600">
                    Accédez aux outils d'administration de l'école
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {profile?.role === 'Admin' && (
                  <Link
                    to="/admin/users"
                    className="group bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold px-4 py-4 rounded-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl text-center"
                  >
                    <Users className="h-6 w-6 mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm">Utilisateurs</span>
                  </Link>
                )}
                {profile?.role === 'Admin' && (
                  <Link
                    to="/admin/instruments"
                    className="group bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold px-4 py-4 rounded-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl text-center"
                  >
                    <Music className="h-6 w-6 mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm">Instruments</span>
                  </Link>
                )}
                {profile?.role === 'Admin' && (
                  <Link
                    to="/admin/orchestras"
                    className="group bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-4 py-4 rounded-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl text-center"
                  >
                    <Users className="h-6 w-6 mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm">Orchestres</span>
                  </Link>
                )}
                {profile?.role === 'Admin' && (
                  <Link
                    to="/admin/events"
                    className="group bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-4 py-4 rounded-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl text-center"
                  >
                    <Calendar className="h-6 w-6 mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm">Événements</span>
                  </Link>
                )}
                <Link
                  to="/admin/media"
                  className="group bg-gradient-to-br from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white font-semibold px-4 py-4 rounded-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl text-center"
                >
                  <Image className="h-6 w-6 mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-sm">Médias</span>
                </Link>
                <Link
                  to="/admin/morceaux"
                  className="group bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold px-4 py-4 rounded-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl text-center"
                >
                  <Music className="h-6 w-6 mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-sm">Morceaux</span>
                </Link>
                <Link
                  to="/admin/partitions"
                  className="group bg-gradient-to-br from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white font-semibold px-4 py-4 rounded-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl text-center"
                >
                  <FileText className="h-6 w-6 mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-sm">Partitions</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Section Événements */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 mb-8 relative overflow-hidden">
          {/* Effet décoratif */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-400/10 to-emerald-500/10 rounded-full -translate-y-20 translate-x-20"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-full shadow-lg">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="font-poppins font-bold text-2xl text-dark">
                    Mes Prochains Événements
                  </h2>
                  <p className="font-inter text-gray-600">
                    Concerts et répétitions à venir
                  </p>
                </div>
              </div>
              <Link
                to="/user/events"
                className="inline-flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium transition-colors bg-green-50 hover:bg-green-100 px-4 py-2 rounded-xl border border-green-200"
              >
                <span>Voir tout</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : userEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userEvents.map((event, index) => (
                  <div key={index} className="group bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-green-200/50 hover:border-green-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-poppins font-semibold text-gray-800 group-hover:text-green-700 transition-colors">
                        {event.title}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        event.event_type === 'concert' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {event.event_type === 'concert' ? 'Concert' : 'Répétition'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-green-500" />
                        <span>
                          {new Date(event.event_date).toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center space-x-2">
                          <Settings className="h-4 w-4 text-gray-400" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.orchestras && event.orchestras.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span className="text-xs">{event.orchestras.map(o => o.name).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white/40 rounded-xl border border-green-200/50">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="font-inter text-gray-600">
                  Aucun événement à venir pour le moment.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section Partitions */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
          {/* Effet décoratif */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/10 to-violet-500/10 rounded-full -translate-y-20 translate-x-20"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-8">
              <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-3 rounded-full shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="font-poppins font-bold text-2xl text-dark">
                  Mes Partitions
                </h2>
                <p className="font-inter text-gray-600">
                  Partitions disponibles pour vos instruments et orchestres
                </p>
              </div>
            </div>

            {partitionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement de vos partitions...</p>
                </div>
              </div>
            ) : Object.keys(partitionsByOrchestra).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(partitionsByOrchestra).map(([orchestraId, { orchestra, morceaux }]) => {
                  const isOrchestraExpanded = expandedOrchestras.has(orchestraId);
                  const morceauxCount = Object.keys(morceaux).length;
                  const totalPartitions = Object.values(morceaux).reduce((total: number, morceauData: any) => {
                    return total + Object.values(morceauData.instruments).reduce((subTotal: number, instrumentData: any) => {
                      return subTotal + instrumentData.partitions.length;
                    }, 0);
                  }, 0);
                  
                  return (
                    <div key={orchestraId} className="border border-blue-200 rounded-xl overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50">
                      {/* Header Orchestre - cliquable */}
                      <button
                        onClick={() => toggleOrchestraExpansion(orchestraId)}
                        className="w-full p-6 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 transition-all duration-200 text-left border-b border-blue-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-lg shadow-md">
                              <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-poppins font-bold text-xl text-dark">
                                {orchestra.name}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                <span>{morceauxCount} morceau{morceauxCount > 1 ? 'x' : ''}</span>
                                <span>•</span>
                                <span>{totalPartitions} partition{totalPartitions > 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </div>
                          <div className={`transform transition-transform duration-200 ${isOrchestraExpanded ? 'rotate-90' : ''}`}>
                            <ChevronRight className="h-6 w-6 text-gray-400" />
                          </div>
                        </div>
                      </button>
                      
                      {/* Morceaux de l'orchestre - collapsible */}
                      <div className={`transition-all duration-300 overflow-hidden ${
                        isOrchestraExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="p-4 space-y-4">
                          {Object.entries(morceaux).map(([morceauId, { morceau, instruments }]) => {
                            const isMorceauExpanded = expandedMorceaux.has(morceauId);
                            const instrumentsCount = Object.keys(instruments).length;
                            const morceauPartitions = Object.values(instruments).reduce((total: number, instrumentData: any) => {
                              return total + instrumentData.partitions.length;
                            }, 0);
                            
                            return (
                              <div key={morceauId} className="bg-white/80 backdrop-blur-sm rounded-xl border border-amber-200 overflow-hidden">
                                {/* Header Morceau - cliquable */}
                                <button
                                  onClick={() => toggleMorceauExpansion(morceauId)}
                                  className="w-full p-4 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-all duration-200 text-left border-b border-amber-200"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-lg shadow-md">
                                        <Music className="h-5 w-5 text-white" />
                                      </div>
                                      <div>
                                        <h4 className="font-poppins font-semibold text-lg text-dark">
                                          {morceau.nom}
                                        </h4>
                                        <div className="flex items-center space-x-3 text-xs text-gray-600">
                                          {morceau.compositeur && (
                                            <span>Compositeur: {morceau.compositeur}</span>
                                          )}
                                          <span>{instrumentsCount} instrument{instrumentsCount > 1 ? 's' : ''}</span>
                                          <span>•</span>
                                          <span>{morceauPartitions} partition{morceauPartitions > 1 ? 's' : ''}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className={`transform transition-transform duration-200 ${isMorceauExpanded ? 'rotate-90' : ''}`}>
                                      <ChevronRight className="h-5 w-5 text-gray-400" />
                                    </div>
                                  </div>
                                </button>
                                
                                {/* Instruments et partitions - collapsible */}
                                <div className={`transition-all duration-300 overflow-hidden ${
                                  isMorceauExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                  <div className="p-4 space-y-3">
                                    {Object.entries(instruments).map(([instrumentId, { instrument, partitions }]) => (
                                      <div key={instrumentId} className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-200">
                                        <div className="flex items-center space-x-3 mb-3">
                                          <div className="bg-gradient-to-br from-purple-400 to-violet-500 p-2 rounded-lg shadow-md">
                                            <Music2 className="h-5 w-5 text-white" />
                                          </div>
                                          <div>
                                            <h5 className="font-poppins font-semibold text-dark">
                                              {instrument.name}
                                            </h5>
                                            <p className="text-xs text-gray-600">
                                              {partitions.length} partition{partitions.length > 1 ? 's' : ''}
                                            </p>
                                          </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          {partitions.map((partition: UserPartition) => (
                                            <div 
                                              key={partition.id} 
                                              className="group bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-purple-200/50 hover:border-purple-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                                              onClick={() => openPartition(partition)}
                                            >
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                  <div className="bg-purple-100 p-2 rounded-lg group-hover:bg-purple-200 transition-colors">
                                                    <FileText className="h-4 w-4 text-purple-600" />
                                                  </div>
                                                  <div>
                                                    <h6 className="font-inter font-medium text-dark text-sm group-hover:text-purple-700 transition-colors">
                                                      {partition.nom}
                                                    </h6>
                                                    {partition.file_name && (
                                                      <p className="text-xs text-gray-500">
                                                        {partition.file_type?.toUpperCase()}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                                {partition.file_path && (
                                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <Download className="h-4 w-4 text-purple-600" />
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/40 rounded-xl border border-purple-200/50">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-poppins font-semibold text-xl text-gray-700 mb-2">
                  Aucune partition disponible
                </h3>
                <p className="font-inter text-gray-600 max-w-md mx-auto">
                  Vos partitions apparaîtront ici une fois que vous serez assigné à des instruments et orchestres, et que des partitions seront ajoutées pour vos morceaux.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;