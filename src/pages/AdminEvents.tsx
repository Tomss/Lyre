import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, Calendar, Search, X, ArrowLeft, Clock, MapPin, ChevronRight, Globe, Users, Info, AlignLeft, LayoutGrid, EyeOff, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

import { API_URL } from '../config';

interface Event {
  id: string;
  title: string;
  description: string | null;
  practical_info: string | null;
  event_type: 'concert' | 'repetition' | 'divers';
  event_date: string;
  location: string | null;
  is_public: boolean;
  orchestras: Orchestra[];
}

interface Orchestra {
  id: string;
  name: string;
  description?: string;
}

interface DeleteConfirmation {
  isOpen: boolean;
  event: Event | null;
}

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

const AdminEvents = () => {
  const { currentUser, token, isAuthenticated } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>(['concert', 'repetition', 'divers']);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['concert', 'repetition', 'divers']));
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    isOpen: false,
    event: null,
  });
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'success',
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    practical_info: '',
    event_type: 'concert' as 'concert' | 'repetition' | 'divers',
    event_date: '',
    location: '',
    is_public: true,
    orchestra_ids: [] as string[],
  });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const fetchEvents = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/events`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Erreur de chargement des événements');
      const data = await response.json();
      setEvents(data || []);
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (showAddForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddForm]);

  const fetchOrchestras = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/orchestras`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Erreur de chargement des orchestres');
      const data = await response.json();
      setOrchestras(data || []);
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  useEffect(() => {
    if (isAuthenticated && (currentUser?.role === "Admin" || currentUser?.managedModules?.includes("news"))) {
      fetchEvents();
      fetchOrchestras();
    }
  }, [isAuthenticated, currentUser, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData((prev) => {
      const newData = { ...prev, [name]: val };
      // Auto-toggle is_public based on selected event type if the user just changed event_type
      if (name === 'event_type') {
        newData.is_public = (val === 'concert' || val === 'divers');
      }
      return newData;
    });
  };

  const handleOrchestraChange = (orchestraId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      orchestra_ids: checked
        ? [...prev.orchestra_ids, orchestraId]
        : prev.orchestra_ids.filter(id => id !== orchestraId)
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);

    const url = editingEvent ? `${API_URL}/events/${editingEvent.id}` : `${API_URL}/events`;
    const method = editingEvent ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Une erreur est survenue');
      }

      const result = await response.json();
      showNotification(result.message);
      cancelEdit();
      fetchEvents();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirmation.event || !token) return;
    try {
      const response = await fetch(`${API_URL}/events/${deleteConfirmation.event.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur de suppression');
      }
      const result = await response.json();
      showNotification(result.message);
      fetchEvents();
      setDeleteConfirmation({ isOpen: false, event: null });
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const confirmDelete = (event: Event) => {
    setDeleteConfirmation({ isOpen: true, event });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, event: null });
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      practical_info: event.practical_info || '',
      event_type: event.event_type,
      event_date: new Date(event.event_date).toISOString().slice(0, 16),
      location: event.location || '',
      is_public: event.is_public !== undefined ? event.is_public : (event.event_type === 'concert' || event.event_type === 'divers'),
      orchestra_ids: event.orchestras?.map(o => o.id) || [],
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setShowAddForm(false);
    setFormData({
      title: '',
      description: '',
      practical_info: '',
      event_type: 'concert',
      event_date: '',
      location: '',
      is_public: true,
      orchestra_ids: [],
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'concert': return 'bg-green-100 text-green-800 border-green-200';
      case 'repetition': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'divers': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'concert': return Calendar;
      case 'repetition': return Clock;
      case 'divers': return MapPin;
      default: return Calendar;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const toggleTypeExpansion = (type: string) => {
    setExpandedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const expandAllTypes = () => {
    setExpandedTypes(new Set(['concert', 'repetition', 'divers']));
  };

  const collapseAllTypes = () => {
    setExpandedTypes(new Set());
  };

  const isUpcoming = (dateString: string) => new Date(dateString) > new Date();
  const isPast = (dateString: string) => new Date(dateString) <= new Date();

  // Filtrer les événements
  const filteredEvents = events.filter(event => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      event.title.toLowerCase().includes(searchLower) ||
      (event.description && event.description.toLowerCase().includes(searchLower)) ||
      (event.location && event.location.toLowerCase().includes(searchLower)) ||
      event.orchestras.some(o => o.name.toLowerCase().includes(searchLower))
    );

    const matchesType = typeFilter.includes(event.event_type);

    const matchesTime = timeFilter === 'all' ||
      (timeFilter === 'upcoming' && isUpcoming(event.event_date)) ||
      (timeFilter === 'past' && isPast(event.event_date));

    return matchesSearch && matchesType && matchesTime;
  });

  // Grouper les événements par type et trier par date (plus ancien au plus récent)
  const eventsByType = filteredEvents
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .reduce((acc, event) => {
      if (!acc[event.event_type]) {
        acc[event.event_type] = [];
      }
      acc[event.event_type].push(event);
      return acc;
    }, {} as Record<string, Event[]>);

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

  if (currentUser && currentUser.role !== 'Admin' && (!currentUser.managedModules || !currentUser.managedModules.includes('news'))) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="font-inter pt-8 lg:pt-12 pb-20 min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="text-slate-400 hover:text-indigo-600 transition flex items-center mb-2 group">
            <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Retour au tableau de bord
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 className="text-3xl font-bold text-slate-800 font-poppins flex items-center">
              <Calendar className="mr-3 h-8 w-8 text-indigo-600" />
              Gestion des Événements
            </h1>
            <button onClick={() => { setEditingEvent(null); setShowAddForm(true); }} className="flex items-center px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
              <Plus className="mr-2 h-5 w-5" />
              Ajouter un événement
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          {/* Row 1: Search Bar */}
          <div>
            <label htmlFor="search" className="block text-sm font-semibold text-slate-700 mb-2">Rechercher un événement</label>
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="search"
                placeholder="Rechercher par titre, description, lieu ou orchestre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          {/* Row 2: Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-indigo-500" /> Filtrer par type
              </label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setTypeFilter(['concert', 'repetition', 'divers'])} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${typeFilter.length >= 3 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tous</button>
                <button onClick={() => setTypeFilter(['concert'])} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${typeFilter.length === 1 && typeFilter[0] === 'concert' ? 'bg-green-500 text-white shadow-md shadow-green-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Concerts</button>
                <button onClick={() => setTypeFilter(['repetition'])} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${typeFilter.length === 1 && typeFilter[0] === 'repetition' ? 'bg-blue-500 text-white shadow-md shadow-blue-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Répétitions</button>
                <button onClick={() => setTypeFilter(['divers'])} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${typeFilter.length === 1 && typeFilter[0] === 'divers' ? 'bg-purple-500 text-white shadow-md shadow-purple-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Divers</button>
              </div>
            </div>
            <div className="lg:border-l lg:pl-6 border-slate-100">
              <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-amber-500" /> Filtrer par date
              </label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setTimeFilter('all')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${timeFilter === 'all' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tous</button>
                <button onClick={() => setTimeFilter('upcoming')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${timeFilter === 'upcoming' ? 'bg-amber-500 text-white shadow-md shadow-amber-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>À venir</button>
                <button onClick={() => setTimeFilter('past')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${timeFilter === 'past' ? 'bg-slate-500 text-white shadow-md shadow-slate-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Passés</button>
                <div className="flex items-center space-x-2 ml-auto">
                    <button onClick={expandAllTypes} className="text-sm bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition">Tout déplier</button>
                    <button onClick={collapseAllTypes} className="text-sm bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition">Tout replier</button>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Events List */}
        {loading ? (
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Chargement des événements...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(eventsByType).map(([type, eventList]) => (
              <div key={type} className="bg-white rounded-xl shadow-lg border border-gray-200/80 overflow-hidden">
                <div onClick={() => toggleTypeExpansion(type)} className={`p-5 flex justify-between items-center cursor-pointer border-b border-gray-200/80 transition-colors ${getTypeColor(type).replace('text-', 'bg-').replace('-800', '-200')} hover:bg-gray-100/50`}>
                  <div className="flex items-center">
                    {React.createElement(getTypeIcon(type), { className: `h-8 w-8 mr-4 ${getTypeColor(type).split(' ')[1].replace('-800', '-600')}` })}
                    <h2 className={`text-2xl font-bold ${getTypeColor(type).split(' ')[1].replace('-800', '-900')}`}>
                      {type === 'concert' ? 'Concerts' : type === 'divers' ? 'Divers' : 'Répétitions'} <span className="text-lg font-normal">({eventList.length})</span>
                    </h2>
                  </div>
                  <ChevronRight className={`transform transition-transform duration-300 ${expandedTypes.has(type) ? 'rotate-90' : ''}`} />
                </div>
                {expandedTypes.has(type) && (
                  <div className="divide-y divide-gray-200/80">
                    {eventList.map(event => (
                      <div key={event.id} className={`p-4 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-gray-50/50 transition-colors duration-200 border-l-4 ${getTypeColor(event.event_type).replace('bg', 'border').replace('-100', '-500')}`}>
                        <div className="flex-1 mb-4 md:mb-0">
                          <div className="flex items-center mb-1">
                            <p className="font-bold text-lg text-gray-800">{event.title}</p>
                            <span className={`ml-3 px-2.5 py-1 text-xs font-semibold rounded-full border ${getTypeColor(event.event_type)}`}>
                              {event.event_type === 'concert' ? 'Concert' : event.event_type === 'divers' ? 'Divers' : 'Répétition'}
                            </span>
                            <div className="ml-3">
                              {event.is_public ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
                                  <span className="w-2 h-2 mr-1 bg-teal-500 rounded-full"></span> Public
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
                                  <span className="w-2 h-2 mr-1 bg-slate-400 rounded-full"></span> Interne
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center text-gray-500 text-sm">
                              <Calendar size={14} className="mr-2" /> {formatDate(event.event_date)}
                            </div>
                            {event.location && (
                                <div className="flex items-center text-gray-500 text-sm">
                                    <MapPin size={14} className="mr-2" /> {event.location}
                                </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 mb-4 md:mb-0">
                          <h4 className="font-semibold text-gray-600 text-sm mb-1">Orchestres</h4>
                          {event.orchestras && event.orchestras.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {event.orchestras.map(orc => (
                                  <span key={orc.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                      {orc.name}
                                  </span>
                              ))}
                            </div>
                          ) : <p className="text-gray-400 text-xs italic">Aucun</p>}
                        </div>
                        <div className="flex items-center space-x-3 flex-shrink-0">
                          <button onClick={() => handleEdit(event)} title="Modifier" className="p-2 text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors duration-200"><Edit size={18} /></button>
                          <button onClick={() => confirmDelete(event)} title="Supprimer" className="p-2 text-red-600 bg-red-100 hover:bg-red-200 rounded-full transition-colors duration-200"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 flex justify-center items-start p-4 pt-24">
            <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border border-white max-h-[calc(100vh-120px)] animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center p-6 bg-white border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                        {editingEvent ? <Edit size={24} /> : <Plus size={24} />}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                        {editingEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
                    </h2>
                </div>
                <button onClick={cancelEdit} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-8 bg-gradient-to-b from-slate-50 to-white">
                {/* Section: Informations générales */}
                <div className="space-y-5">
                    <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                        <Info size={18} />
                        <h3 className="text-sm font-bold uppercase tracking-wider">Informations générales</h3>
                    </div>
                    
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                        <div>
                            <label className="flex items-center text-sm font-semibold text-slate-700 mb-1.5">
                                <FileText size={16} className="mr-2 text-slate-400" /> Titre de l'événement *
                            </label>
                            <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Ex: Concert de Printemps" required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="flex items-center text-sm font-semibold text-slate-700 mb-1.5">
                                    <LayoutGrid size={16} className="mr-2 text-slate-400" /> Type d'événement
                                </label>
                                <div className="relative">
                                    <select name="event_type" value={formData.event_type} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white appearance-none">
                                        <option value="concert">🎵 Concert</option>
                                        <option value="repetition">⏱️ Répétition</option>
                                        <option value="divers">✨ Divers</option>
                                    </select>
                                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                            
                            <div className="flex items-end">
                                <label className="flex items-center space-x-3 cursor-pointer group w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition-colors h-[46px]">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${formData.is_public ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                        {formData.is_public ? <Globe size={16} /> : <EyeOff size={16} />}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex items-center justify-between">
                                            <span className={`font-semibold text-xs ${formData.is_public ? 'text-emerald-700' : 'text-slate-500'}`}>Visible public</span>
                                            <input type="checkbox" name="is_public" checked={formData.is_public} onChange={handleInputChange} className="sr-only" />
                                            <div className={`w-8 h-4 rounded-full relative transition-colors ${formData.is_public ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${formData.is_public ? 'translate-x-[18px]' : 'translate-x-0.5'}`}></div>
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center text-sm font-semibold text-slate-700 mb-1.5">
                                <AlignLeft size={16} className="mr-2 text-slate-400" /> Description
                            </label>
                            <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description courte..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white h-24 resize-none"></textarea>
                        </div>
                    </div>
                </div>

                {/* Section: Date & Lieu */}
                <div className="space-y-5">
                    <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                        <MapPin size={18} />
                        <h3 className="text-sm font-bold uppercase tracking-wider">Date & Lieu</h3>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="flex items-center text-sm font-semibold text-slate-700 mb-1.5">
                                    <Calendar size={16} className="mr-2 text-slate-400" /> Date et heure *
                                </label>
                                <input type="datetime-local" name="event_date" value={formData.event_date} onChange={handleInputChange} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white" />
                            </div>
                            <div>
                                <label className="flex items-center text-sm font-semibold text-slate-700 mb-1.5">
                                    <MapPin size={16} className="mr-2 text-slate-400" /> Lieu
                                </label>
                                <input type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="Ex: Salle des fêtes" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white" />
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center text-sm font-semibold text-slate-700 mb-1.5">
                                <Info size={16} className="mr-2 text-slate-400" /> Infos pratiques <span className="text-[10px] ml-1.5 text-slate-400 font-normal">(Membres uniquement)</span>
                            </label>
                            <textarea name="practical_info" value={formData.practical_info} onChange={handleInputChange} placeholder="Horaires de rdv, tenue, etc..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white h-24 resize-none"></textarea>
                        </div>
                    </div>
                </div>

                {/* Section: Orchestres */}
                <div className="space-y-5">
                    <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                        <Users size={18} />
                        <h3 className="text-sm font-bold uppercase tracking-wider">Orchestres concernés</h3>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {orchestras.map(orchestra => (
                                <label key={orchestra.id} className="flex items-center p-3 rounded-xl border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all cursor-pointer group">
                                    <div className="relative flex items-center justify-center w-5 h-5 mr-3">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.orchestra_ids.includes(orchestra.id)} 
                                            onChange={e => handleOrchestraChange(orchestra.id, e.target.checked)} 
                                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer" 
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700 transition-colors">{orchestra.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end p-6 bg-white border-t border-slate-100 gap-3 flex-shrink-0">
                  <button type="button" onClick={cancelEdit} className="px-6 py-3 text-slate-500 hover:text-slate-700 font-bold transition hover:bg-slate-50 rounded-xl">
                    Annuler
                  </button>
                  <button type="submit" disabled={loading} className="px-8 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold transition shadow-lg shadow-indigo-200 flex items-center justify-center">
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Enregistrement...
                        </>
                    ) : (editingEvent ? 'Mettre à jour' : 'Créer l\'événement')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-8 m-4 max-w-md w-full">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirmer la suppression</h3>
              <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer l'événement <span className="font-bold">{deleteConfirmation.event?.title}</span> ?</p>
              <div className="flex justify-end space-x-4">
                <button onClick={cancelDelete} className="px-6 py-2 rounded-lg border hover:bg-gray-100">Annuler</button>
                <button onClick={handleDelete} className="bg-red-600 text-white px-6 py-2 rounded-lg shadow hover:bg-red-700">Supprimer</button>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification.show && (
          <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white z-50 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {notification.message}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminEvents;