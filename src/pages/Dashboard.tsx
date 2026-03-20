import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LogOut, Users, Music, Music2, Calendar, Image, FileText, Download, ChevronRight, ChevronDown, User, MapPin, Info, Clock, Palette, Building2, Newspaper } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { API_URL } from '../config';

const Dashboard = () => {
  const { currentUser, logout, token } = useAuth();
  const [userInstruments, setUserInstruments] = React.useState<any[]>([]);
  const [userOrchestras, setUserOrchestras] = React.useState<any[]>([]);
  const [userEvents, setUserEvents] = React.useState<any[]>([]);
  const [userPartitions, setUserPartitions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [partitionsLoading, setPartitionsLoading] = React.useState(true);
  const [expandedOrchestras, setExpandedOrchestras] = React.useState<Set<string>>(new Set());
  const [expandedMorceaux, setExpandedMorceaux] = React.useState<Set<string>>(new Set());
  const [expandedEventTypes, setExpandedEventTypes] = React.useState<Set<string>>(new Set(['concert', 'repetition']));
  const [expandedPracticalInfo, setExpandedPracticalInfo] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser || !token) {
        setLoading(false);
        setPartitionsLoading(false);
        return;
      }

      setLoading(true);
      setPartitionsLoading(true);

      try {
        const response = await fetch(`${API_URL}/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();
        setUserInstruments(data.userInstruments || []);
        setUserOrchestras(data.userOrchestras || []);
        setUserEvents(data.userEvents || []);
        setUserPartitions(data.userPartitions || []);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Optionnel: afficher un message d'erreur à l'utilisateur
      } finally {
        setLoading(false);
        setPartitionsLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser, token]);

  const groupPartitionsByOrchestra = (partitions: any[]) => {
    return partitions.reduce((acc, partition) => {
      const orchestra = partition.morceaux?.orchestras?.[0]; // Simplifié: prend le premier orchestre
      if (orchestra) {
        if (!acc[orchestra.name]) {
          acc[orchestra.name] = [];
        }
        acc[orchestra.name].push(partition);
      }
      return acc;
    }, {} as Record<string, any[]>);
  };

  const groupPartitionsByMorceau = (partitions: any[]) => {
    return partitions.reduce((acc, partition) => {
      const morceauNom = partition.morceaux?.nom || 'Morceau inconnu';
      if (!acc[morceauNom]) {
        acc[morceauNom] = [];
      }
      acc[morceauNom].push(partition);
      return acc;
    }, {} as Record<string, any[]>);
  };

  const partitionsByOrchestra = groupPartitionsByOrchestra(userPartitions);

  const toggleOrchestra = (orchestraName: string) => {
    const newSet = new Set(expandedOrchestras);
    if (newSet.has(orchestraName)) {
      newSet.delete(orchestraName);
    } else {
      newSet.add(orchestraName);
    }
    setExpandedOrchestras(newSet);
  };

  const toggleMorceau = (morceauName: string) => {
    const newSet = new Set(expandedMorceaux);
    if (newSet.has(morceauName)) {
      newSet.delete(morceauName);
    } else {
      newSet.add(morceauName);
    }
    setExpandedMorceaux(newSet);
  };

  const toggleEventType = (type: string) => {
    const newSet = new Set(expandedEventTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setExpandedEventTypes(newSet);
  };

  const togglePracticalInfo = (eventId: string) => {
    const newSet = new Set(expandedPracticalInfo);
    if (newSet.has(eventId)) {
      newSet.delete(eventId);
    } else {
      newSet.add(eventId);
    }
    setExpandedPracticalInfo(newSet);
  };

  const eventsByType = userEvents.reduce((acc, event) => {
    const type = event.event_type || 'autre';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(event);
    return acc;
  }, {} as Record<string, any[]>);

  const getEventTypeStyles = (eventType: string) => {
    switch (eventType) {
      case 'concert':
        return {
          icon: Calendar,
          gradient: 'from-blue-100 to-indigo-100',
          color: 'text-indigo-600',
          tagBg: 'bg-blue-50',
          tagText: 'text-blue-800',
          infoBoxBorder: 'border-blue-200',
        };
      case 'repetition':
        return {
          icon: Clock,
          gradient: 'from-gray-100 to-gray-200',
          color: 'text-gray-600',
          tagBg: 'bg-gray-50',
          tagText: 'text-gray-700',
          infoBoxBorder: 'border-gray-200',
        };
      default:
        return {
          icon: Calendar,
          gradient: 'from-gray-100 to-gray-200',
          color: 'text-gray-600',
          tagBg: 'bg-gray-50',
          tagText: 'text-gray-700',
          infoBoxBorder: 'border-gray-200',
        };
    }
  };

  const getOrchestraColor = (orchestraName: string) => {
    const colors = [
      { bg: 'bg-teal-100', text: 'text-teal-800' },
      { bg: 'bg-amber-100', text: 'text-amber-800' },
      { bg: 'bg-lime-100', text: 'text-lime-800' },
      { bg: 'bg-rose-100', text: 'text-rose-800' },
      { bg: 'bg-cyan-100', text: 'text-cyan-800' },
    ];
    let hash = 0;
    for (let i = 0; i < orchestraName.length; i++) {
      hash = orchestraName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
  };


  if (!currentUser) {
    return <Navigate to="/connexion" />;
  }

  return (
    <div className="font-inter pt-8 lg:pt-12 pb-20 min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -m-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -m-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center space-x-6">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-full shadow-lg">
                  <User className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="font-poppins font-bold text-4xl text-dark">
                    Bonjour, {currentUser.firstName}!
                  </h1>
                  <p className="font-inter text-lg text-gray-600 mt-1">
                    Bienvenue sur votre espace personnel.
                  </p>
                </div>
              </div>
              <div className="mt-6 md:mt-0 md:ml-6 flex-shrink-0">
                <button
                  onClick={() => logout()}
                  className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-teal-600 text-white font-medium px-6 py-3 rounded-xl transition-all duration-300 hover:shadow-lg shadow-md shadow-slate-900/20"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section Mes Informations */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
          <h2 className="font-poppins font-bold text-2xl text-dark mb-6">Mes Informations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-5 rounded-xl">
              <h3 className="font-semibold text-lg text-dark mb-3">Mon Profil</h3>
              <div className="space-y-2 text-gray-700">
                <p><span className="font-semibold">Nom:</span> {currentUser.firstName} {currentUser.lastName}</p>
                <p><span className="font-semibold">Email:</span> {currentUser.email}</p>
                <p><span className="font-semibold">Rôle:</span>
                  <span className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentUser.role === 'Admin' ? 'bg-red-100 text-red-800' :
                    currentUser.role === 'Gestionnaire' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                    {currentUser.role}
                  </span>
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-5 rounded-xl">
              <h3 className="font-semibold text-lg text-dark mb-3">Mes Orchestres</h3>
              {loading ? <p>Chargement...</p> : userOrchestras.length > 0 ? (
                <ul className="space-y-2">
                  {userOrchestras.map(o =>
                    <li key={o.id} className="flex items-center space-x-2 text-gray-700">
                      <Music2 className="h-5 w-5 text-purple-500" />
                      <span>{o.name}</span>
                    </li>
                  )}
                </ul>
              ) : <p className="text-gray-500">Aucun orchestre.</p>}
            </div>
            <div className="bg-gray-50 p-5 rounded-xl">
              <h3 className="font-semibold text-lg text-dark mb-3">Mes Instruments</h3>
              {loading ? <p>Chargement...</p> : userInstruments.length > 0 ? (
                <ul className="space-y-2">
                  {userInstruments.map(i =>
                    <li key={i.id} className="flex items-center space-x-2 text-gray-700">
                      <Music className="h-5 w-5 text-yellow-500" />
                      <span>{i.name}</span>
                    </li>
                  )}
                </ul>
              ) : <p className="text-gray-500">Aucun instrument.</p>}
            </div>
          </div>
        </div>

        {/* Section Admin/Gestionnaire */}
        {(currentUser?.role === 'Admin' || currentUser?.role === 'Gestionnaire') && (
          <div className="mb-12">
            <div className="text-center mb-16 mt-16 animate-on-scroll">
              <h2 className="font-poppins font-bold text-3xl md:text-5xl text-slate-900 mb-6 relative inline-block">
                Panneau d'Administration
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-teal-500 rounded-full"></div>
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {(currentUser?.role === 'Admin' || currentUser?.managedModules?.includes('users')) && (
                <Link to="/admin/users" className="admin-card group">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                    <Users className="h-8 w-8" />
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Utilisateurs</span>
                </Link>
              )}
              
              {(currentUser?.role === 'Admin' || currentUser?.managedModules?.includes('orchestras')) && (
                <Link to="/admin/orchestras" className="admin-card group">
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm">
                    <Music2 className="h-8 w-8" />
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Orchestres</span>
                </Link>
              )}

              {(currentUser?.role === 'Admin' || currentUser?.managedModules?.includes('morceaux')) && (
                <>
                  <Link to="/admin/morceaux" className="admin-card group">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      <Music className="h-8 w-8" />
                    </div>
                    <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Morceaux</span>
                  </Link>
                  <Link to="/admin/partitions" className="admin-card group">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      <FileText className="h-8 w-8" />
                    </div>
                    <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Partitions</span>
                  </Link>
                </>
              )}

              {(currentUser?.role === 'Admin' || currentUser?.managedModules?.includes('instruments')) && (
                <Link to="/admin/instruments" className="admin-card group">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-sm">
                    <Music className="h-8 w-8" />
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Instruments</span>
                </Link>
              )}

              {(currentUser?.role === 'Admin' || currentUser?.managedModules?.includes('news')) && (
                <>
                  <Link to="/admin/news" className="admin-card group">
                    <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300 shadow-sm">
                      <Newspaper className="h-8 w-8" />
                    </div>
                    <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Actualités</span>
                  </Link>
                  <Link to="/admin/events" className="admin-card group">
                    <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white transition-all duration-300 shadow-sm">
                      <Calendar className="h-8 w-8" />
                    </div>
                    <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Agenda</span>
                  </Link>
                </>
              )}

              {(currentUser?.role === 'Admin' || currentUser?.managedModules?.includes('media')) && (
                <Link to="/admin/media" className="admin-card group">
                  <div className="w-16 h-16 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-pink-500 group-hover:text-white transition-all duration-300 shadow-sm">
                    <Image className="h-8 w-8" />
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Médias</span>
                </Link>
              )}

              {(currentUser?.role === 'Admin' || currentUser?.managedModules?.includes('theme')) && (
                <Link to="/admin/theme" className="admin-card group">
                  <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300 shadow-sm">
                    <Palette className="h-8 w-8" />
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Thème</span>
                </Link>
              )}

              {(currentUser?.role === 'Admin' || currentUser?.managedModules?.includes('partners')) && (
                <Link to="/admin/partners" className="admin-card group">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-cyan-600 group-hover:text-white transition-all duration-300 shadow-sm">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Partenaires</span>
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Section Événements */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-poppins font-bold text-2xl text-dark">Prochains Événements</h2>
              <Link to="/user/events" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                Voir tout
              </Link>
            </div>
            {loading ? (
              <p>Chargement...</p>
            ) : userEvents.length > 0 ? (
              <div className="space-y-5">
                {Object.entries(eventsByType).map(([type, eventsList]) => {
                  const events = eventsList as any[];
                  const styles = getEventTypeStyles(type);
                  const TypeIcon = styles.icon;
                  const isExpanded = expandedEventTypes.has(type);

                  return (
                    <div key={type} className="bg-white/60 backdrop-blur-sm rounded-xl shadow-md border border-white/50 overflow-hidden">
                      <button onClick={() => toggleEventType(type)} className="w-full flex items-center justify-between p-4 bg-gray-50/80 hover:bg-gray-100/80 transition-colors">
                        <h3 className="font-poppins font-semibold text-lg text-dark flex items-center">
                          <TypeIcon className={`h-6 w-6 mr-3 ${styles.color}`} />
                          {type.charAt(0).toUpperCase() + type.slice(1)}s ({events.length})
                        </h3>
                        {isExpanded ? <ChevronDown className="text-gray-600" /> : <ChevronRight className="text-gray-500" />}
                      </button>
                      {isExpanded && (
                        <ul className="p-4 space-y-4">
                          {events.map((event: any) => {
                            const isPracticalInfoExpanded = expandedPracticalInfo.has(event.id);
                            return (
                              <li key={event.id} className="p-5 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                                <div className="flex items-start space-x-4">
                                  <div className={`flex-shrink-0 h-12 w-12 bg-gradient-to-br ${styles.gradient} rounded-lg flex items-center justify-center`}>
                                    <TypeIcon className={`h-6 w-6 ${styles.color}`} />
                                  </div>
                                  <div className="flex-grow">
                                    <div className="flex items-center justify-between">
                                      <p className="font-bold text-dark text-lg">{event.title}</p>
                                      <span className={`px-2.5 py-1 ${styles.tagBg} ${styles.tagText} text-xs font-semibold rounded-full`}>
                                        {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600 mt-1">
                                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                      <span>{new Date(event.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    {event.location && (
                                      <div className="flex items-center text-sm text-gray-500 mt-1">
                                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                        <span>{event.location}</span>
                                      </div>
                                    )}
                                    {event.orchestras && event.orchestras.length > 0 && (
                                      <div className="mt-3">
                                        <div className="flex flex-wrap gap-2">
                                          {event.orchestras.map((o: any) => {
                                            const orchestraColor = getOrchestraColor(o.name);
                                            return (
                                              <span key={o.id} className={`px-2.5 py-1 ${orchestraColor.bg} ${orchestraColor.text} text-xs font-semibold rounded-full flex items-center space-x-1`}>
                                                <Music2 className="h-3 w-3" />
                                                <span>{o.name}</span>
                                              </span>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )}
                                    {event.practical_info && (
                                      <div className="mt-3">
                                        <button onClick={() => togglePracticalInfo(event.id)} className={`w-full text-left flex items-center justify-between p-2 rounded-lg ${styles.tagBg} hover:bg-opacity-80`}>
                                          <h4 className={`font-semibold text-sm ${styles.tagText}`}>Informations pratiques</h4>
                                          {isPracticalInfoExpanded ? <ChevronDown size={18} className={styles.tagText} /> : <ChevronRight size={18} className={styles.tagText} />}
                                        </button>
                                        {isPracticalInfoExpanded && (
                                          <div className={`mt-2 p-3 ${styles.tagBg} border ${styles.infoBoxBorder} rounded-lg`}>
                                            <div className="flex items-start space-x-3">
                                              <Info className={`h-5 w-5 ${styles.color} mt-0.5 flex-shrink-0`} />
                                              <div>
                                                <p className={`text-sm ${styles.tagText} mt-1 whitespace-pre-wrap`}>
                                                  {event.practical_info}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl">
                <Calendar className="h-10 w-10 mx-auto text-gray-400" />
                <p className="mt-4 text-gray-600">Aucun événement à venir.</p>
              </div>
            )}
          </div>

          {/* Section Partitions */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
            <h2 className="font-poppins font-bold text-2xl text-dark mb-6">Mes Partitions</h2>
            {partitionsLoading ? (
              <p>Chargement des partitions...</p>
            ) : Object.keys(partitionsByOrchestra).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(partitionsByOrchestra).map(([orchestraName, partitionsList]) => {
                  const partitions = partitionsList as any[];
                  const partitionsByMorceau = groupPartitionsByMorceau(partitions);
                  return (
                    <div key={orchestraName} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <button onClick={() => toggleOrchestra(orchestraName)} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <h3 className="font-poppins font-semibold text-lg text-dark flex items-center"><Music2 className="h-6 w-6 mr-3 text-purple-500" />{orchestraName}</h3>
                        {expandedOrchestras.has(orchestraName) ? <ChevronDown className="text-gray-600" /> : <ChevronRight className="text-gray-500" />}
                      </button>
                      {expandedOrchestras.has(orchestraName) && (
                        <div className="p-4 border-t border-gray-200">
                          {Object.entries(partitionsByMorceau).map(([morceauName, psList]) => {
                            const ps = psList as any[];
                            return (
                            <div key={morceauName} className="mb-3 last:mb-0">
                              <button onClick={() => toggleMorceau(morceauName)} className="w-full text-left flex items-center justify-between py-2">
                                <h4 className="font-semibold text-md text-dark flex items-center"><Music className="h-5 w-5 mr-2 text-green-500" />{morceauName}</h4>
                                {expandedMorceaux.has(morceauName) ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-400" />}
                              </button>
                              {expandedMorceaux.has(morceauName) && (
                                <ul className="mt-2 pl-7 space-y-2">
                                  {ps.map((p: any) => (
                                    <li key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                      <div className="flex items-center space-x-3">
                                        <FileText size={18} className="text-indigo-500" />
                                        <span className="text-gray-800">{p.nom} ({p.instruments.name})</span>
                                      </div>
                                      <a href={p.file_path} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-md hover:bg-blue-100">
                                        <Download size={18} />
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucune partition disponible pour vos instruments.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div >
  );
};

export default Dashboard;