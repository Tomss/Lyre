import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, Calendar, Search, X, CheckCircle, ArrowLeft, Clock, MapPin, Users, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

import { API_URL } from '../config';

interface Event {
  id: string;
  title: string;
  description: string | null;
  practical_info: string | null;
  event_type: 'concert' | 'repetition';
  event_date: string;
  location: string | null;
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
  const [typeFilter, setTypeFilter] = useState<string[]>(['concert', 'repetition']);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['concert', 'repetition', 'autre', 'reunion']));
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
    event_type: 'concert' as 'concert' | 'repetition',
    event_date: '',
    location: '',
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
    if (isAuthenticated && currentUser?.role === 'Admin') {
      fetchEvents();
      fetchOrchestras();
    }
  }, [isAuthenticated, currentUser, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      orchestra_ids: [],
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'concert': return 'bg-green-100 text-green-800';
      case 'repetition': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'concert': return Calendar;
      case 'repetition': return Clock;
      default: return Calendar;
    }
  };

  const toggleTypeFilter = (type: string) => {
    setTypeFilter(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

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
    setExpandedTypes(new Set(['concert', 'repetition', 'autre', 'reunion']));
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

  if (currentUser?.role !== 'Admin') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="font-inter pt-20 lg:pt-40 pb-20 min-h-screen bg-gray-100">
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
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="relative mb-4">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un événement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Type:</span>
              <button onClick={() => setTypeFilter(['concert', 'repetition', 'autre', 'reunion'])} className={`px-3 py-1 rounded-full text-sm ${typeFilter.length >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Tous</button>
              <button onClick={() => setTypeFilter(['concert'])} className={`px-3 py-1 rounded-full text-sm ${typeFilter.length === 1 && typeFilter[0] === 'concert' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>Concerts</button>
              <button onClick={() => setTypeFilter(['repetition'])} className={`px-3 py-1 rounded-full text-sm ${typeFilter.length === 1 && typeFilter[0] === 'repetition' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>Répétitions</button>
              <button onClick={() => setTypeFilter(['autre', 'reunion'])} className={`px-3 py-1 rounded-full text-sm ${typeFilter.some(t => ['autre', 'reunion'].includes(t)) && typeFilter.length <= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>Autres</button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Date:</span>
              <button onClick={() => setTimeFilter('all')} className={`px-3 py-1 rounded-full text-sm ${timeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Tous</button>
              <button onClick={() => setTimeFilter('upcoming')} className={`px-3 py-1 rounded-full text-sm ${timeFilter === 'upcoming' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>À venir</button>
              <button onClick={() => setTimeFilter('past')} className={`px-3 py-1 rounded-full text-sm ${timeFilter === 'past' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>Passés</button>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={expandAllTypes} className="text-sm bg-gray-200 px-3 py-1 rounded-md">Tout déplier</button>
              <button onClick={collapseAllTypes} className="text-sm bg-gray-200 px-3 py-1 rounded-md">Tout replier</button>
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
                <div onClick={() => toggleTypeExpansion(type)} className="p-5 flex justify-between items-center cursor-pointer bg-gray-50/80 border-b border-gray-200/80 hover:bg-gray-100/50 transition-colors">
                  <div className="flex items-center">
                    {React.createElement(getTypeIcon(type), { className: `h-8 w-8 mr-4 ${getTypeColor(type).replace('bg-', 'text-').replace('-100', '-600')}` })}
                    <h2 className={`text-2xl font-bold ${getTypeColor(type).replace('bg-', 'text-').replace('-100', '-800')}`}>{type === 'concert' ? 'Concerts' : 'Répétitions'} <span className="text-lg font-normal">({eventList.length})</span></h2>
                  </div>
                  <ChevronRight className={`transform transition-transform duration-300 ${expandedTypes.has(type) ? 'rotate-90' : ''}`} />
                </div>
                {expandedTypes.has(type) && (
                  <div className="divide-y divide-gray-200/80">
                    {eventList.map(event => (
                      <div key={event.id} className={`p-4 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-gray-50/50 transition-colors duration-200`}>
                        <div className="flex items-center flex-1 mb-4 md:mb-0">
                          <div className={`p-3 rounded-lg mr-4 ${getTypeColor(event.event_type)}`}>
                            {React.createElement(getTypeIcon(event.event_type), { className: "h-6 w-6" })}
                          </div>
                          <div className="flex-grow">
                            <p className="font-bold text-lg text-gray-800">{event.title}</p>
                            <div className="flex items-center text-gray-600 text-sm mb-2">
                              <Calendar size={16} className="mr-2" /> {formatDate(event.event_date)}
                            </div>
                            {event.location && <div className="flex items-center text-gray-600 text-sm">
                              <MapPin size={16} className="mr-2" /> {event.location}
                            </div>}
                          </div>
                        </div>
                        <div className="flex-1 text-sm">
                          <h4 className="font-semibold text-gray-700 mb-1">Orchestres:</h4>
                          <ul className="list-disc list-inside text-gray-600">
                            {event.orchestras.map(o => <li key={o.id}>{o.name}</li>)}
                          </ul>
                        </div>
                        <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                          <button onClick={() => handleEdit(event)} className="p-2 text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors duration-200"><Edit size={18} /></button>
                          <button onClick={() => confirmDelete(event)} className="p-2 text-red-600 bg-red-100 hover:bg-red-200 rounded-full transition-colors duration-200"><Trash2 size={18} /></button>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-5 border-b">
                <h2 className="text-2xl font-bold text-gray-800">{editingEvent ? 'Modifier' : 'Ajouter'} un événement</h2>
                <button onClick={cancelEdit} className="p-2 rounded-full hover:bg-gray-200"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Titre de l'événement" required className="w-full px-4 py-2 border rounded-lg" />
                <select name="event_type" value={formData.event_type} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg bg-white">
                  <option value="concert">Concert</option>
                  <option value="repetition">Répétition</option>
                </select>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" className="w-full px-4 py-2 border rounded-lg h-24"></textarea>
                <textarea name="practical_info" value={formData.practical_info} onChange={handleInputChange} placeholder="Informations pratiques (visible uniquement par les membres)" className="w-full px-4 py-2 border rounded-lg h-24"></textarea>
                <input type="datetime-local" name="event_date" value={formData.event_date} onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-lg" />
                <input type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="Lieu" className="w-full px-4 py-2 border rounded-lg" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Orchestres</label>
                  <div className="grid grid-cols-2 gap-2">
                    {orchestras.map(orchestra => (
                      <label key={orchestra.id} className="flex items-center space-x-2">
                        <input type="checkbox" checked={formData.orchestra_ids.includes(orchestra.id)} onChange={e => handleOrchestraChange(orchestra.id, e.target.checked)} className="rounded" />
                        <span>{orchestra.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t">
                  <button type="button" onClick={cancelEdit} className="mr-4 px-6 py-2 rounded-lg border hover:bg-gray-100">Annuler</button>
                  <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:bg-blue-300">
                    {loading ? 'Enregistrement...' : (editingEvent ? 'Mettre à jour' : 'Créer')}
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