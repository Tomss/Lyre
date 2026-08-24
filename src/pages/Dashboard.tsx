import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ChevronUp,  LogOut, Users, Music, Music2, Calendar, Image, FileText, Download, ChevronRight, ChevronDown, User, UserCircle, Mail, MapPin, Info, Clock, Palette, Building2, Bell, Newspaper, Search, X  } from "lucide-react";
import ActivityFeed, { Activity } from '../components/ActivityFeed';
import { useAuth } from '../context/AuthContext';

import { API_URL } from '../config';

const Dashboard = () => {
  const { currentUser, logout, token } = useAuth();
  const [userInstruments, setUserInstruments] = React.useState<any[]>([]);
  const [userOrchestras, setUserOrchestras] = React.useState<any[]>([]);
  const [userEvents, setUserEvents] = React.useState<any[]>([]);
  const [userPartitions, setUserPartitions] = React.useState<any[]>([]);
  const [activityLogs, setActivityLogs] = React.useState<Activity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [partitionsLoading, setPartitionsLoading] = React.useState(true);
  const [expandedOrchestras, setExpandedOrchestras] = React.useState<Set<string>>(new Set());
  const [expandedMorceaux, setExpandedMorceaux] = React.useState<Set<string>>(new Set());
  const [expandedEventTypes, setExpandedEventTypes] = React.useState<Set<string>>(new Set());
  const [expandedPracticalInfo, setExpandedPracticalInfo] = React.useState<Set<string>>(new Set());
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [lastSeenId, setLastSeenId] = React.useState<string | null>(localStorage.getItem('lastSeenActivityId'));
  const [eventFilter, setEventFilter] = React.useState<string>('all');
  const [partitionSearch, setPartitionSearch] = React.useState<string>('');

  React.useEffect(() => {
    if (lastSeenId) {
      localStorage.setItem('lastSeenActivityId', lastSeenId);
    }
  }, [lastSeenId]);

  const getUnreadCount = () => {
    if (activityLogs.length === 0) return 0;
    if (!lastSeenId) return activityLogs.length;
    const lastSeenIndex = activityLogs.findIndex(log => log.id === lastSeenId);
    return lastSeenIndex === -1 ? activityLogs.length : lastSeenIndex;
  };

  const prevIsNotificationsOpen = React.useRef(isNotificationsOpen);

  React.useEffect(() => {
    // On ne marque comme vu QUE si on vient de FERMER le panneau
    // Cela permet aux nouvelles notifications de rester "nouvelles" (badge + highlight) pendant la consultation
    if (prevIsNotificationsOpen.current === true && isNotificationsOpen === false && activityLogs.length > 0) {
      setLastSeenId(activityLogs[0].id);
    }
    prevIsNotificationsOpen.current = isNotificationsOpen;
  }, [isNotificationsOpen, activityLogs]);

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const handleActivityClick = (activity: Activity) => {
    if (activity.type === 'event' && activity.target_id) {
      // 1. Fermer les notifications
      setIsNotificationsOpen(false);
      
      // 2. Trouver l'événement pour connaître son type (pour l'expansion)
      const targetEvent = userEvents.find(e => e.id === activity.target_id);
      if (targetEvent) {
        // 3. Étendre la catégorie d'événement si nécessaire
        const newExpandedTypes = new Set(expandedEventTypes);
        newExpandedTypes.add(targetEvent.event_type);
        setExpandedEventTypes(newExpandedTypes);
        
        // 4. Scroller vers l'événement
        setTimeout(() => {
          const element = document.getElementById(`event-${activity.target_id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Animation premium
            element.classList.add('highlight-event');
            setTimeout(() => {
              element.classList.remove('highlight-event');
            }, 2000);
          }
        }, 150);
      }
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isNotificationsOpen && !target.closest('.notifications-container')) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen]);

  const fetchDashboardData = React.useCallback(async (silent = false) => {
    if (!currentUser || !token) {
      setLoading(false);
      setPartitionsLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
      setPartitionsLoading(true);
    }

    try {
      const response = await fetch(`${API_URL}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      interface DashboardData {
        userInstruments: any[];
        userOrchestras: any[];
        userEvents: any[];
        userPartitions: any[];
        activityLogs: Activity[];
      }

      const data: DashboardData = await response.json();
      setUserInstruments(data.userInstruments || []);
      setUserOrchestras(data.userOrchestras || []);
      setUserEvents(data.userEvents || []);
      setUserPartitions(data.userPartitions || []);
      setActivityLogs(data.activityLogs || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      if (!silent) {
        setLoading(false);
        setPartitionsLoading(false);
      }
    }
  }, [currentUser, token]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Robust real-time updates: 30s polling fallback + SSE with proper reconnection guard
  React.useEffect(() => {
    if (!token) return;

    let isMounted = true;
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(`${API_URL}/events-push`);

      eventSource.onmessage = (event) => {
        if (isMounted && event.data === 'update') {
          fetchDashboardData(true);
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
        }
      };
    } catch (e) {}

    // Polling fallback every 30 seconds to guarantee data freshness without CPU thrashing
    const interval = setInterval(() => {
      if (isMounted) fetchDashboardData(true);
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [token, fetchDashboardData]);

  const formatDateMini = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

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
        acc[morceauNom] = {
          partitions: [],
          created_at: partition.morceaux?.created_at
        };
      }
      acc[morceauNom].partitions.push(partition);
      return acc;
    }, {} as Record<string, { partitions: any[], created_at: string }>);
  };

  const toggleOrchestra = (orchestraName: string) => {
    const newSet = new Set(expandedOrchestras);
    if (newSet.has(orchestraName)) {
      newSet.delete(orchestraName);
      const orchestraPartitions = partitionsByOrchestra[orchestraName] || [];
      const newMorceauxSet = new Set(expandedMorceaux);
      orchestraPartitions.forEach((p: any) => {
        const morceauNom = p.morceaux?.nom;
        if (morceauNom) {
          newMorceauxSet.delete(morceauNom);
        }
      });
      setExpandedMorceaux(newMorceauxSet);
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
      const typeEvents = eventsByType[type] || [];
      const newInfoSet = new Set(expandedPracticalInfo);
      typeEvents.forEach((ev: any) => {
        newInfoSet.delete(ev.id);
      });
      setExpandedPracticalInfo(newInfoSet);
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

  const filteredEvents = React.useMemo(() => {
    return userEvents.filter(event => 
      eventFilter === 'all' || event.event_type === eventFilter
    );
  }, [userEvents, eventFilter]);

  const eventsByType = React.useMemo(() => {
    return filteredEvents.reduce((acc, event) => {
      const type = event.event_type || 'divers';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(event);
      return acc;
    }, {} as Record<string, any[]>);
  }, [filteredEvents]);

  const filteredPartitions = React.useMemo(() => {
    return userPartitions.filter(partition => {
      const searchLower = partitionSearch.toLowerCase();
      const morceauNom = partition.morceaux?.nom?.toLowerCase() || '';
      const partitionNom = partition.nom?.toLowerCase() || '';
      const instrumentNom = partition.instruments?.name?.toLowerCase() || '';
      return morceauNom.includes(searchLower) || partitionNom.includes(searchLower) || instrumentNom.includes(searchLower);
    });
  }, [userPartitions, partitionSearch]);

  const partitionsByOrchestra = React.useMemo(() => {
    return groupPartitionsByOrchestra(filteredPartitions);
  }, [filteredPartitions]);

  const expandAllEvents = () => {
    setExpandedEventTypes(new Set(Object.keys(eventsByType)));
  };

  const collapseAllEvents = () => {
    setExpandedEventTypes(new Set());
    setExpandedPracticalInfo(new Set());
  };

  const expandAllOrchestras = () => {
    setExpandedOrchestras(new Set(Object.keys(partitionsByOrchestra)));
  };

  const collapseAllOrchestras = () => {
    setExpandedOrchestras(new Set());
    setExpandedMorceaux(new Set());
  };

  const getEventTypeStyles = (eventType: string) => {
    switch (eventType) {
      case 'concert':
        return {
          icon: Calendar,
          gradient: 'from-indigo-500 to-purple-600',
          color: 'text-indigo-600',
          tagBg: 'bg-indigo-50',
          tagText: 'text-indigo-700',
          infoBoxBorder: 'border-indigo-100',
          lightGradient: 'from-indigo-50 to-white',
        };
      case 'repetition':
        return {
          icon: Clock,
          gradient: 'from-emerald-500 to-teal-600',
          color: 'text-emerald-600',
          tagBg: 'bg-emerald-50',
          tagText: 'text-emerald-700',
          infoBoxBorder: 'border-emerald-100',
          lightGradient: 'from-emerald-50 to-white',
        };
      case 'divers':
      default:
        return {
          icon: Calendar,
          gradient: 'from-slate-500 to-slate-600',
          color: 'text-slate-600',
          tagBg: 'bg-slate-50',
          tagText: 'text-slate-700',
          infoBoxBorder: 'border-slate-100',
          lightGradient: 'from-slate-50 to-white',
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
    <div className="pt-8 lg:pt-12 pb-20 min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -m-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -m-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="w-full px-4 sm:px-10 lg:px-16 relative z-10">
        {/* Welcome & Global Actions Section */}
        <div className="mb-8 relative z-40">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between relative group">
                
                <div className="flex items-center space-x-6 mb-6 md:mb-0">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg transform group-hover:rotate-6 transition-transform duration-300">
                        <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="font-black text-2xl md:text-3xl text-slate-800">
                            Bonjour, {currentUser.firstName}!
                        </h1>
                        <p className="text-slate-500">
                            Ravi de vous revoir.
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Notifications Toggle Button */}
                    <div className="relative notifications-container">
                        <button
                            onClick={toggleNotifications}
                            className={`p-3 rounded-xl border transition-all duration-300 relative h-[52px] w-[52px] flex items-center justify-center ${isNotificationsOpen ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 shadow-sm'}`}
                        >
                            <Bell className={`h-6 w-6 ${getUnreadCount() > 0 && !isNotificationsOpen ? 'animate-tada' : ''}`} />
                            {getUnreadCount() > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-bounce">
                                    {getUnreadCount()}
                                </span>
                            )}
                        </button>
                        
                        {/* Dropdown Panel - DARK THEME */}
                        {isNotificationsOpen && (
                            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden">
                                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <Bell className="w-5 h-5 text-indigo-400" />
                                        Notifications
                                    </h3>
                                    <span className="text-[10px] font-bold text-indigo-400 px-2 py-0.5 bg-indigo-500/10 rounded-full uppercase tracking-wider border border-indigo-500/20">
                                        Événements
                                    </span>
                                </div>
                                        <ActivityFeed 
                                            activities={activityLogs} 
                                            onItemClick={handleActivityClick}
                                            lastSeenId={lastSeenId}
                                        />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => logout()}
                        className="inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-teal-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-teal-500/20"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="hidden sm:inline">Se déconnecter</span>
                    </button>
                </div>
            </div>
        </div>

        {/* Grid de Profil/Infos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Card: Mon Profil */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20 group-hover:scale-110 transition-transform duration-300">
                <UserCircle className="h-7 w-7" />
              </div>
              <h2 className="font-bold text-xl text-slate-800">Mon Profil</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                   <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Nom complet</p>
                  <p className="text-sm font-bold text-slate-700 truncate">{currentUser.firstName} {currentUser.lastName.toUpperCase()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                   <Mail className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Email</p>
                  <p className="text-sm font-bold text-slate-700 truncate">{currentUser.email}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-3">Rôle & Permissions</p>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  currentUser.role === 'Admin' ? 'bg-rose-500/10 text-rose-500' :
                  currentUser.role === 'Gestionnaire' ? 'bg-blue-500/10 text-blue-500' :
                  'bg-slate-500/10 text-slate-500'
                }`}>
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Mes Orchestres */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 border border-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                <Music2 className="h-7 w-7" />
              </div>
              <h2 className="font-bold text-xl text-slate-800">Mes Orchestres</h2>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : userOrchestras.length > 0 ? (
                userOrchestras.map(o => (
                  <div key={o.id} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100/50 transition-colors hover:bg-slate-50">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-purple-500 shadow-sm border border-purple-100">
                       <Music2 className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">{o.name}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm italic text-slate-400">Aucun orchestre.</p>
                </div>
              )}
            </div>
          </div>

          {/* Card: Mes Instruments */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                <Music className="h-7 w-7" />
              </div>
              <h2 className="font-bold text-xl text-slate-800">Mes Instruments</h2>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                </div>
              ) : userInstruments.length > 0 ? (
                userInstruments.map(i => (
                  <div key={i.id} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100/50 transition-colors hover:bg-slate-50">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-amber-500 shadow-sm border border-amber-100">
                       <Music className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">{i.name}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm italic text-slate-400">Aucun instrument.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section Admin/Gestionnaire */}
        {(currentUser?.role === 'Admin' || currentUser?.role === 'Gestionnaire') && (
          <div className="mb-12">
            <div className="text-center mb-16 mt-16">
              <h2 className="font-bold text-3xl md:text-5xl text-slate-900 mb-6 relative inline-block">
                Panneau d'Administration
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-teal-500 rounded-full"></div>
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {(currentUser?.role === 'Admin' || currentUser?.managedModules?.includes('users')) && (
                <Link to="/admin/users" className="admin-card group block bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <Users className="h-8 w-8" />
                  </div>
                  <span className="font-bold text-slate-700">Utilisateurs</span>
                </Link>
              )}
              
              {(currentUser?.role === 'Admin' || currentUser?.managedModules?.includes('orchestras')) && (
                <Link to="/admin/orchestras" className="admin-card group block bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                    <Music2 className="h-8 w-8" />
                  </div>
                  <span className="font-bold text-slate-700">Orchestres</span>
                </Link>
              )}

              {(currentUser?.role === 'Admin' || currentUser?.managedModules?.includes('morceaux')) && (
                <>
                  <Link to="/admin/morceaux" className="admin-card group block bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                      <Music className="h-8 w-8" />
                    </div>
                    <span className="font-bold text-slate-700">Morceaux</span>
                  </Link>
                  <Link to="/admin/partitions" className="admin-card group block bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                      <FileText className="h-8 w-8" />
                    </div>
                    <span className="font-bold text-slate-700">Partitions</span>
                  </Link>
                </>
              )}

              {(currentUser?.role === 'Admin' || currentUser?.managedModules?.includes('instruments')) && (
                <Link to="/admin/instruments" className="admin-card group block bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                    <Music className="h-8 w-8" />
                  </div>
                  <span className="font-bold text-slate-700">Instruments</span>
                </Link>
              )}

              {(currentUser?.role === 'Admin' || currentUser?.managedModules?.includes('news')) && (
                <>
                  <Link to="/admin/news" className="admin-card group block bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
                      <Newspaper className="h-8 w-8" />
                    </div>
                    <span className="font-bold text-slate-700">Actualités</span>
                  </Link>
                  <Link to="/admin/events" className="admin-card group block bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
                      <Calendar className="h-8 w-8" />
                    </div>
                    <span className="font-bold text-slate-700">Agenda</span>
                  </Link>
                </>
              )}

              {(currentUser?.role === 'Admin' || currentUser?.managedModules?.includes('communication')) && (
                <Link to="/admin/communication" className="admin-card group block bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                    <Mail className="h-8 w-8" />
                  </div>
                  <span className="font-bold text-slate-700">Communication</span>
                </Link>
              )}

              {(currentUser?.role === 'Admin' || currentUser?.managedModules?.includes('media')) && (
                <Link to="/admin/media" className="admin-card group block bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-pink-500 group-hover:text-white transition-all duration-300">
                    <Image className="h-8 w-8" />
                  </div>
                  <span className="font-bold text-slate-700">Médias</span>
                </Link>
              )}

              {(currentUser?.role === 'Admin' || currentUser?.managedModules?.includes('theme')) && (
                <Link to="/admin/theme" className="admin-card group block bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300">
                    <Palette className="h-8 w-8" />
                  </div>
                  <span className="font-bold text-slate-700">Thème</span>
                </Link>
              )}

              {(currentUser?.role === 'Admin' || currentUser?.managedModules?.includes('partners')) && (
                <Link to="/admin/partners" className="admin-card group block bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-cyan-600 group-hover:text-white transition-all duration-300">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <span className="font-bold text-slate-700">Partenaires</span>
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="space-y-8 [overflow-anchor:none]">
          {/* Section Agenda */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 [overflow-anchor:none]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 text-dark border-b border-gray-100 pb-4">
              <h2 className="font-bold text-2xl flex items-center gap-3">
                <Calendar className="h-7 w-7 text-indigo-600" />
                Mon Agenda
              </h2>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={expandAllEvents}
                  className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-200 transition text-[10px] font-bold uppercase tracking-widest cursor-pointer"
                >
                  Tout déplier
                </button>
                <button 
                  onClick={collapseAllEvents}
                  className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-200 transition text-[10px] font-bold uppercase tracking-widest cursor-pointer"
                >
                  Tout replier
                </button>
              </div>
            </div>

            {/* Filtres Agenda */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { id: 'all', label: 'Tous', color: 'bg-slate-100 text-slate-600' },
                { id: 'concert', label: 'Concerts', color: 'bg-indigo-100 text-indigo-700' },
                { id: 'repetition', label: 'Répétitions', color: 'bg-emerald-100 text-emerald-700' },
                { id: 'divers', label: 'Divers', color: 'bg-slate-100 text-slate-700' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setEventFilter(filter.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                    eventFilter === filter.id 
                      ? `${filter.color} border-transparent shadow-sm scale-105` 
                      : 'bg-white text-slate-400 border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            {loading ? (
              <p className="text-dark">Chargement...</p>
            ) : userEvents.length > 0 ? (
              <div className="space-y-5">
                {Object.entries(eventsByType)
                  .sort(([a], [b]) => {
                    const translated = { concert: 'Concerts', divers: 'Divers', repetition: 'Répétitions' };
                    return (translated[a as keyof typeof translated] || a).localeCompare((translated[b as keyof typeof translated] || b));
                  })
                  .map(([type, eventsList]) => {
                  const events = eventsList as any[];
                  const styles = getEventTypeStyles(type);
                  const TypeIcon = styles.icon;
                  const isExpanded = expandedEventTypes.has(type);

                  const now = new Date();
                  const upcomingEvents = events
                    .filter(e => new Date(e.event_date) >= now)
                    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
                  const nextEventId = upcomingEvents.length > 0 ? upcomingEvents[0].id : null;

                  return (
                    <div key={type} className="bg-slate-50/70 rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden transition-colors duration-200 hover:border-indigo-200 [overflow-anchor:none]">
                      <button 
                        onClick={(e) => toggleEventType(type, e)} 
                        className={`w-full flex items-center justify-between p-5 bg-gradient-to-r ${styles.lightGradient} hover:opacity-90 transition-colors cursor-pointer`}
                      >
                        <h3 className="font-bold text-lg text-slate-800 flex items-center group">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${styles.gradient} text-white mr-4 shadow-sm group-hover:scale-110 transition-transform`}>
                            <TypeIcon className="h-5 w-5" />
                          </div>
                          {type.charAt(0).toUpperCase() + type.slice(1)}s
                          <span className="ml-3 text-xs font-medium px-2 py-0.5 bg-white/50 rounded-full border border-gray-100 text-slate-500">
                            {events.length}
                          </span>
                        </h3>
                        <ChevronDown className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="border-t border-slate-200/60 bg-white/30 p-5">
                          <ul className="space-y-4">
                          {events.map((event: any) => {
                            const isPracticalInfoExpanded = expandedPracticalInfo.has(event.id);
                            const isNextEvent = event.id === nextEventId;
                            return (
                              <li 
                                key={event.id} 
                                id={`event-${event.id}`}
                                className={`p-6 rounded-2xl border transition-colors duration-200 relative group overflow-hidden ${
                                  isNextEvent 
                                    ? `bg-white border-indigo-200 shadow-md ring-1 ring-indigo-50` 
                                    : 'bg-white/80 border-gray-100 shadow-sm'
                                } hover:shadow-xl hover:translate-x-1`}
                              >
                                {isNextEvent && (
                                  <div className="absolute top-0 right-0">
                                    <div className="bg-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm tracking-widest animate-pulse">
                                      PROCHAIN
                                    </div>
                                  </div>
                                )}
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b opacity-10 group-hover:opacity-100 transition-opacity" style={{ backgroundImage: `linear-gradient(to bottom, var(--tw-gradient-from), var(--tw-gradient-to))` }}></div>
                                <div className="flex items-start gap-5">
                                  <div className={`flex-shrink-0 h-14 w-14 bg-gradient-to-br ${styles.gradient} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-3 transition-transform`}>
                                    <TypeIcon className="h-7 w-7 text-white" />
                                  </div>
                                  <div className="flex-grow">
                                    <div className="flex items-start justify-between mb-2">
                                      <div>
                                        <h4 className="font-bold text-slate-900 text-xl leading-tight mb-1">{event.title}</h4>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                          <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-2 text-indigo-400" />
                                            <span className="font-medium text-slate-600">
                                              {new Date(event.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                          </div>
                                          {event.location && (
                                            <div className="flex items-center">
                                              <MapPin className="h-4 w-4 mr-2 text-rose-400" />
                                              <span className="truncate max-w-[200px]">{event.location}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <span className={`px-3 py-1 ${styles.tagBg} ${styles.tagText} text-[10px] font-bold uppercase tracking-widest rounded-full border ${styles.infoBoxBorder}`}>
                                        {event.event_type}
                                      </span>
                                    </div>

                                    {event.orchestras && event.orchestras.length > 0 && (
                                      <div className="mt-4 flex flex-wrap gap-2">
                                        {event.orchestras.map((o: any) => {
                                          const oColor = getOrchestraColor(o.name);
                                          return (
                                            <span key={o.id} className={`px-2.5 py-1 ${oColor.bg} ${oColor.text} text-[10px] font-bold rounded-lg border flex items-center gap-1.5 shadow-sm`}>
                                              <Music2 className="h-3 w-3" />
                                              {o.name}
                                            </span>
                                          )
                                        })}
                                      </div>
                                    )}

                                    {event.practical_info && (
                                      <div className="mt-4">
                                        <button 
                                          onClick={(e) => togglePracticalInfo(event.id, e)} 
                                          className={`group/info flex items-center gap-2 text-xs font-bold ${styles.tagText} hover:bg-white p-2 rounded-lg transition-colors border border-transparent hover:border-gray-100 shadow-sm bg-gray-50/50 cursor-pointer`}
                                        >
                                          <Info className="h-4 w-4" />
                                          Plus d'infos
                                          <ChevronDown size={14} className={`transition-transform duration-300 ${isPracticalInfoExpanded ? 'rotate-180' : ''}`} />
                                        </button>
                                        
                                        {isPracticalInfoExpanded && (
                                          <div className={`mt-3 p-4 bg-white rounded-xl border-t-4 ${styles.infoBoxBorder} shadow-inner`}>
                                            <div className="prose prose-sm max-w-none text-slate-700">
                                              {event.practical_info}
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
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-50">
                  <Calendar className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-bold text-lg">Aucun événement à venir.</p>
              </div>
            )}
          </div>

          {/* Section Partitions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 [overflow-anchor:none]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 text-dark border-b border-gray-100 pb-4">
              <h2 className="font-bold text-2xl flex items-center gap-3">
                <Music2 className="h-7 w-7 text-purple-600" />
                Mes Partitions
              </h2>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={expandAllOrchestras}
                  className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-200 transition text-[10px] font-bold uppercase tracking-widest cursor-pointer"
                >
                  Tout déplier
                </button>
                <button 
                  onClick={collapseAllOrchestras}
                  className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-200 transition text-[10px] font-bold uppercase tracking-widest cursor-pointer"
                >
                  Tout replier
                </button>
              </div>
            </div>

            {/* Barre de recherche Partitions */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={partitionSearch}
                onChange={(e) => setPartitionSearch(e.target.value)}
                placeholder="Rechercher un morceau, un instrument..."
                className="block w-full pl-10 pr-10 py-2.5 border border-gray-100 rounded-xl bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 transition-all"
              />
              {partitionSearch && (
                <button 
                  onClick={() => setPartitionSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {partitionsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Récupération des partitions...</p>
              </div>
            ) : Object.keys(partitionsByOrchestra).length > 0 ? (
              <div className="space-y-6 [overflow-anchor:none]">
                {Object.entries(partitionsByOrchestra)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([orchestraName, partitionsList]) => {
                  const partitions = partitionsList as any[];
                  const partitionsByMorceau = groupPartitionsByMorceau(partitions);
                  const isOrchestraExpanded = expandedOrchestras.has(orchestraName);
                  return (
                    <div key={orchestraName} className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-white/60 overflow-hidden transition-colors duration-200 hover:shadow-md [overflow-anchor:none]">
                      <button 
                        onClick={(e) => toggleOrchestra(orchestraName, e)} 
                        className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-purple-50 to-white hover:opacity-90 transition-colors cursor-pointer"
                      >
                        <h3 className="font-bold text-lg text-slate-800 flex items-center">
                          <Music2 className="h-5 w-5 mr-3 text-purple-500" />
                          {orchestraName}
                          <span className="ml-3 text-xs font-medium px-2 py-0.5 bg-white/50 rounded-full border border-gray-100 text-slate-500">
                            {partitions.length}
                          </span>
                        </h3>
                        <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isOrchestraExpanded ? 'rotate-180 text-purple-600' : ''}`} />
                      </button>
                      
                      {isOrchestraExpanded && (
                        <div className="p-4 space-y-4 border-t border-purple-100/80 bg-slate-50/30">
                          {Object.entries(partitionsByMorceau)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([morceauName, data]) => {
                            const ps = (data as any).partitions;
                            const isMorceauExpanded = expandedMorceaux.has(morceauName);
                            return (
                              <div key={morceauName} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden [overflow-anchor:none]">
                                <button 
                                  onClick={(e) => toggleMorceau(morceauName, e)} 
                                  className={`w-full text-left flex items-center justify-between p-4 transition-colors duration-200 group/item cursor-pointer ${isMorceauExpanded ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}
                                >
                                  <div className="flex flex-col">
                                    <h4 className="font-bold text-lg text-slate-800 flex items-center gap-3">
                                      <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600">
                                        <Music className="h-4 w-4" />
                                      </div>
                                      {morceauName}
                                    </h4>
                                    {(data as any).created_at && (
                                      <span className="text-[10px] text-slate-400 mt-1 ml-11 font-medium italic">Ajouté le {formatDateMini((data as any).created_at)}</span>
                                    )}
                                  </div>
                                  <ChevronDown size={20} className={`transition-transform duration-300 ${isMorceauExpanded ? 'rotate-180 text-emerald-600' : 'text-slate-400'}`} />
                                </button>
                                
                                {isMorceauExpanded && (
                                  <ul className="divide-y divide-slate-50 bg-slate-50/50 border-t border-slate-100">
                                    {(ps as any[]).sort((a, b) => a.nom.localeCompare(b.nom)).map((p: any) => (
                                      <li key={p.id} className="flex items-center justify-between p-4 hover:bg-white transition-all group/file">
                                        <div className="flex items-center space-x-4">
                                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 transition-all">
                                            <FileText size={20} />
                                          </div>
                                          <div>
                                            <span className="block text-sm font-bold text-slate-700 uppercase tracking-tight">{p.nom}</span>
                                            <div className="flex items-center gap-3">
                                              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5 mt-0.5">
                                                <Music size={10} />
                                                {p.instruments.name}
                                              </span>
                                              {p.created_at && (
                                                <span className="text-[10px] text-slate-400 font-medium mt-0.5">• Ajouté le {formatDateMini(p.created_at)}</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <a 
                                          href={p.file_path} 
                                          target="_blank" 
                                          rel="noreferrer" 
                                          className="flex items-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                        >
                                          <Download size={14} />
                                          <span>Ouvrir</span>
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
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-50">
                  <Music2 className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-bold text-lg">Aucune partition ici.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
