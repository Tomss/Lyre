import React, { useState, useEffect, FormEvent } from 'react';
import { ChevronDown, Edit, Trash2, Plus, Calendar, Search, X, ArrowLeft, Clock, MapPin, ChevronRight, Globe, Users, Info, AlignLeft, LayoutGrid, EyeOff, FileText, Image as ImageIcon, Upload, Music, CheckCircle2, XCircle, HelpCircle, Copy, Check, MessageSquare, Loader2 } from "lucide-react";
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

import { API_URL } from '../config';
import { getOptimizedImageUrl } from '../utils/image';

interface Event {
  id: string;
  title: string;
  description: string | null;
  practical_info: string | null;
  event_type: 'concert' | 'repetition' | 'divers';
  event_date: string;
  end_time?: string | null;
  location: string | null;
  is_public: boolean;
  image_url?: string | null;
  fallback_image_url?: string | null;
  orchestras: Orchestra[];
  attendance_present?: number;
  attendance_absent?: number;
  attendance_total_target?: number;
}

interface AttendanceUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  attendance_status: 'present' | 'absent' | null;
  attendance_comment: string | null;
  attendance_updated_at: string | null;
  instruments: string | null;
  orchestras: string | null;
}

interface AttendanceDetails {
  total_target: number;
  counts: {
    present: number;
    absent: number;
    unanswered: number;
    rate: number;
  };
  presents: AttendanceUser[];
  absents: AttendanceUser[];
  unanswered: AttendanceUser[];
}

interface Orchestra {
  id: string;
  name: string;
  description?: string;
  photo_url?: string | null;
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
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['concert', 'repetition', 'divers']));
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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
    start_time: '20:00',
    end_time: '',
    location: '',
    is_public: true,
    image_url: '',
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

  const [selectedAttendanceEvent, setSelectedAttendanceEvent] = useState<Event | null>(null);
  const [attendanceDetails, setAttendanceDetails] = useState<AttendanceDetails | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState<boolean>(false);
  const [attendanceSearch, setAttendanceSearch] = useState<string>('');
  const [attendanceTab, setAttendanceTab] = useState<'present' | 'absent' | 'unanswered'>('present');
  const [copiedRoster, setCopiedRoster] = useState<boolean>(false);
  const [hoveredAttendanceEventId, setHoveredAttendanceEventId] = useState<string | null>(null);
  const [hoverAttendanceCache, setHoverAttendanceCache] = useState<Record<string, AttendanceDetails>>({});
  const [hoverLoadingMap, setHoverLoadingMap] = useState<Record<string, boolean>>({});

  const handleAttendanceHover = async (eventId: string) => {
    setHoveredAttendanceEventId(eventId);
    if (!token || hoverAttendanceCache[eventId] || hoverLoadingMap[eventId]) return;

    setHoverLoadingMap(prev => ({ ...prev, [eventId]: true }));
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/attendances`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setHoverAttendanceCache(prev => ({ ...prev, [eventId]: data }));
      }
    } catch (e) {
      // Ignore hover background errors
    } finally {
      setHoverLoadingMap(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleAttendanceLeave = () => {
    setHoveredAttendanceEventId(null);
  };

  const openAttendanceModal = async (event: Event) => {
    setSelectedAttendanceEvent(event);
    setAttendanceLoading(true);
    setAttendanceDetails(hoverAttendanceCache[event.id] || null);
    setAttendanceSearch('');
    setAttendanceTab('present');

    try {
      const response = await fetch(`${API_URL}/events/${event.id}/attendances`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des présences');
      const data = await response.json();
      setAttendanceDetails(data);
      setHoverAttendanceCache(prev => ({ ...prev, [event.id]: data }));
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const closeAttendanceModal = () => {
    setSelectedAttendanceEvent(null);
    setAttendanceDetails(null);
  };

  const copyRosterToClipboard = () => {
    if (!attendanceDetails || !selectedAttendanceEvent) return;
    const lines = [
      `🎵 Feuille de présence - ${selectedAttendanceEvent.title}`,
      `📅 Date : ${formatDate(selectedAttendanceEvent.event_date, selectedAttendanceEvent.end_time)}`,
      `📊 Taux de présence : ${attendanceDetails.counts.rate}% (${attendanceDetails.counts.present}/${attendanceDetails.total_target})`,
      '',
      `🟢 PRÉSENTS (${attendanceDetails.presents.length}) :`,
      ...attendanceDetails.presents.map(u => `  • ${u.first_name} ${u.last_name}${u.instruments ? ` (${u.instruments})` : ''}`),
      '',
      `🔴 ABSENTS (${attendanceDetails.absents.length}) :`,
      ...attendanceDetails.absents.map(u => `  • ${u.first_name} ${u.last_name}${u.instruments ? ` (${u.instruments})` : ''}`),
      '',
      `⚪ SANS RÉPONSE (${attendanceDetails.unanswered.length}) :`,
      ...attendanceDetails.unanswered.map(u => `  • ${u.first_name} ${u.last_name}${u.instruments ? ` (${u.instruments})` : ''}`)
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedRoster(true);
    setTimeout(() => setCopiedRoster(false), 2500);
  };

  useEffect(() => {
    if (showAddForm || deleteConfirmation.isOpen || selectedAttendanceEvent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddForm, deleteConfirmation.isOpen, selectedAttendanceEvent]);

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
        if (val !== 'repetition') {
          newData.end_time = '';
        }
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, image_url: '' }));
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      const isUpdating = !!editingEvent;
      const url = isUpdating ? `${API_URL}/events/${editingEvent.id}` : `${API_URL}/events`;
      const method = isUpdating ? 'PUT' : 'POST';

      // 1. Upload photo if a new file was chosen
      let finalImageUrl = formData.image_url;
      if (photoFile) {
        const photoFormData = new FormData();
        photoFormData.append('file', photoFile);
        const uploadRes = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: photoFormData,
        });
        if (!uploadRes.ok) throw new Error('Échec du téléchargement de la photo');
        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.filePath;
      }

      // 2. Combine date and start_time into standard ISO format
      const combinedEventDate = `${formData.event_date}T${formData.start_time || '20:00'}:00`;
      const payload = {
        ...formData,
        event_date: combinedEventDate,
        image_url: finalImageUrl || null,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
    setSubmitting(false);
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
    
    // Extract separate date (YYYY-MM-DD) and start_time (HH:mm)
    const localISOTime = event.event_date || '';
    const datePart = localISOTime ? localISOTime.slice(0, 10) : '';
    const timePart = localISOTime && localISOTime.length >= 16 ? localISOTime.slice(11, 16) : '20:00';

    setFormData({
      title: event.title,
      description: event.description || '',
      practical_info: event.practical_info || '',
      event_type: event.event_type,
      event_date: datePart,
      start_time: timePart,
      end_time: event.end_time ? event.end_time.slice(0, 5) : '',
      location: event.location || '',
      is_public: event.is_public !== undefined ? event.is_public : (event.event_type === 'concert' || event.event_type === 'divers'),
      image_url: event.image_url || '',
      orchestra_ids: event.orchestras?.map(o => o.id) || [],
    });
    setPhotoFile(null);
    setPhotoPreview(event.image_url || null);
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setShowAddForm(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData({
      title: '',
      description: '',
      practical_info: '',
      event_type: 'concert',
      event_date: '',
      start_time: '20:00',
      end_time: '',
      location: '',
      is_public: true,
      image_url: '',
      orchestra_ids: [],
    });
  };

  const clearAllFilters = () => {
    setTypeFilter(['concert', 'repetition', 'divers']);
    setTimeFilter('all');
    setSearchTerm('');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'concert': return { bg: 'bg-gradient-to-r from-indigo-50 to-white', text: 'text-indigo-900', icon: 'text-indigo-600', iconBg: 'bg-indigo-100', badge: 'bg-white/50 border-indigo-100 text-indigo-600', border: 'border-l-indigo-500' };
      case 'repetition': return { bg: 'bg-gradient-to-r from-emerald-50 to-white', text: 'text-emerald-900', icon: 'text-emerald-600', iconBg: 'bg-emerald-100', badge: 'bg-white/50 border-emerald-100 text-emerald-600', border: 'border-l-emerald-500' };
      case 'divers': return { bg: 'bg-gradient-to-r from-amber-50 to-white', text: 'text-amber-900', icon: 'text-amber-600', iconBg: 'bg-amber-100', badge: 'bg-white/50 border-amber-100 text-amber-600', border: 'border-l-amber-500' };
      default: return { bg: 'bg-gradient-to-r from-slate-50 to-white', text: 'text-slate-900', icon: 'text-slate-600', iconBg: 'bg-slate-100', badge: 'bg-white/50 border-slate-100 text-slate-600', border: 'border-l-slate-500' };
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

  // Filtrer les événements de manière sécurisée sans risque de crash
  const filteredEvents = events.filter(event => {
    if (!event) return false;
    const searchLower = (searchTerm || '').trim().toLowerCase();
    
    const matchesSearch = !searchLower || (
      (event.title ? event.title.toLowerCase().includes(searchLower) : false) ||
      (event.description ? event.description.toLowerCase().includes(searchLower) : false) ||
      (event.practical_info ? event.practical_info.toLowerCase().includes(searchLower) : false) ||
      (event.location ? event.location.toLowerCase().includes(searchLower) : false) ||
      (Array.isArray(event.orchestras) && event.orchestras.some(o => o && o.name ? o.name.toLowerCase().includes(searchLower) : false))
    );

    const matchesType = !typeFilter.length || typeFilter.includes(event.event_type);

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

  const formatDate = (dateString: string, endTime?: string | null) => {
    const dateObj = new Date(dateString);
    const datePart = dateObj.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const startTime = dateObj.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (endTime) {
      // Normalize endTime if in HH:mm:ss format
      const formattedEndTime = endTime.slice(0, 5).replace(':', 'h');
      const formattedStartTime = startTime.replace(':', 'h');
      return `${datePart} de ${formattedStartTime} à ${formattedEndTime}`;
    }

    return `${datePart} à ${startTime.replace(':', 'h')}`;
  };

  if (currentUser && currentUser.role !== 'Admin' && (!currentUser.managedModules || !currentUser.managedModules.includes('news'))) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="pt-8 lg:pt-12 pb-20 min-h-screen bg-gray-100">
      <div className="w-full px-4 sm:px-10 lg:px-16">

        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="text-slate-400 hover:text-indigo-600 transition flex items-center mb-2 group">
            <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Retour au tableau de bord
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-sm border border-indigo-50 flex-shrink-0">
                <Calendar size={28} />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800">
                Gestion des Événements
              </h1>
            </div>
            <button onClick={() => { setEditingEvent(null); setShowAddForm(true); }} className="flex items-center px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 mt-4 md:mt-0">
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
          <div className="flex flex-col lg:flex-row gap-6 pt-2 border-t border-slate-100">
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
              </div>
            </div>
            <div className="lg:border-l lg:pl-6 border-slate-100 flex flex-col justify-start gap-2 border-t lg:border-t-0 pt-4 lg:pt-0 min-w-[200px]">
              <button onClick={clearAllFilters} className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors w-full text-left md:text-center block mb-2">Réinitialiser les filtres</button>
              <div className="flex items-center space-x-2">
                <button onClick={expandAllTypes} className={`px-4 py-2 rounded-xl transition text-sm font-medium whitespace-nowrap w-full ${expandedTypes.size === 3 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tout déplier</button>
                <button onClick={collapseAllTypes} className={`px-4 py-2 rounded-xl transition text-sm font-medium whitespace-nowrap w-full ${expandedTypes.size === 0 ? 'bg-slate-600 text-white shadow-md shadow-slate-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tout replier</button>
              </div>
            </div>
          </div>
        </div>



        {/* Events List */}
        {loading ? (
          <div className="text-center text-gray-500 py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4">Chargement des événements...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">Aucun événement trouvé</h3>
            <p className="text-sm text-slate-400">Modifiez vos critères de recherche ou réinitialisez les filtres.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(eventsByType)
              .sort(([a], [b]) => {
                const getLabel = (t: string) => t === 'concert' ? 'Concerts' : t === 'divers' ? 'Divers' : 'Répétitions';
                return getLabel(a).localeCompare(getLabel(b));
              })
              .map(([type, eventList]) => {
              const color = getTypeColor(type);
              return (
              <div key={type} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
                <div onClick={() => toggleTypeExpansion(type)} className={`p-4 flex justify-between items-center cursor-pointer ${color.bg} hover:opacity-90 transition-all`}>
                  <div className="flex items-center">
                    <div className={`p-2 ${color.iconBg} rounded-xl ${color.icon} mr-4 shadow-sm`}>
                      {React.createElement(getTypeIcon(type), { size: 20 })}
                    </div>
                    <div className="flex items-center">
                      <h2 className={`text-lg font-bold ${color.text}`}>
                        {type === 'concert' ? 'Concerts' : type === 'divers' ? 'Divers' : 'Répétitions'} 
                      </h2>
                      <span className={`ml-3 px-2.5 py-0.5 rounded-full border text-xs font-bold ${color.badge}`}>
                        {eventList.length}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="text-slate-400" />
                </div>
                <div className={`grid transition-all duration-300 ease-in-out ${expandedTypes.has(type) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="divide-y divide-slate-100">
                      {eventList.map(event => (
                        <div key={event.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-slate-50/80 transition-colors duration-200 gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* Miniature Photo */}
                            <div className="w-16 h-12 sm:w-20 sm:h-14 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200/80 relative flex items-center justify-center shadow-sm">
                              {(event.image_url || event.fallback_image_url) ? (
                                <img 
                                  src={getOptimizedImageUrl(event.image_url || event.fallback_image_url!, 200, 80)} 
                                  alt={event.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Music className="w-6 h-6 text-slate-300" />
                              )}
                              {event.image_url && (
                                <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" title="Photo personnalisée"></span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-slate-800 text-base sm:text-lg mb-1 truncate">{event.title}</h3>
                              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                                <span className="flex items-center text-indigo-600 font-medium bg-indigo-50 px-2.5 py-0.5 rounded-md">
                                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                  {formatDate(event.event_date, event.end_time)}
                                </span>
                                {event.location && (
                                  <span className="flex items-center">
                                    <MapPin className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                    {event.location}
                                  </span>
                                )}
                                {event.is_public ? (
                                  <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 rounded-md font-medium text-xs border border-emerald-100">
                                    <Globe className="w-3 h-3 mr-1" />
                                    Public
                                  </span>
                                ) : (
                                  <span className="flex items-center text-slate-500 bg-slate-100 px-2 rounded-md font-medium text-xs border border-slate-200">
                                    <EyeOff className="w-3 h-3 mr-1" />
                                    Privé
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 md:max-w-xs mb-2 md:mb-0">
                            <h4 className="font-semibold text-gray-600 text-xs uppercase tracking-wider mb-1">Orchestres</h4>
                            {event.orchestras && event.orchestras.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {event.orchestras.map(orc => (
                                    <span key={orc.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                        {orc.name}
                                    </span>
                                ))}
                              </div>
                            ) : <p className="text-gray-400 text-xs italic">Tous / Aucun</p>}
                          </div>

                          {/* Indicateur Synthétique de Présence avec Info-Bulle survol */}
                          <div 
                            onClick={() => openAttendanceModal(event)}
                            onMouseEnter={() => handleAttendanceHover(event.id)}
                            onMouseLeave={handleAttendanceLeave}
                            className="relative flex flex-col min-w-[155px] p-2.5 rounded-xl bg-slate-50/90 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 transition-all cursor-pointer group/att shadow-2xs"
                          >
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-bold text-slate-700 group-hover/att:text-indigo-700 flex items-center gap-1">
                                <Users size={13} className="text-slate-400 group-hover/att:text-indigo-600" />
                                Présences
                              </span>
                              <span className="text-[11px] font-bold text-slate-600">
                                {event.attendance_present || 0} / {event.attendance_total_target || 0}
                              </span>
                            </div>

                            {/* Mini jauge tricolore */}
                            <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden flex mb-1.5">
                              <div 
                                className="bg-emerald-500 h-full transition-all duration-300"
                                style={{ width: `${event.attendance_total_target ? Math.min(100, Math.round(((event.attendance_present || 0) / event.attendance_total_target) * 100)) : 0}%` }}
                              />
                              <div 
                                className="bg-rose-500 h-full transition-all duration-300"
                                style={{ width: `${event.attendance_total_target ? Math.min(100, Math.round(((event.attendance_absent || 0) / event.attendance_total_target) * 100)) : 0}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className="text-emerald-700 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {event.attendance_present || 0} prés.
                              </span>
                              <span className="text-rose-700 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                {event.attendance_absent || 0} abs.
                              </span>
                              <span className="text-slate-400 flex items-center gap-1 font-medium">
                                {Math.max(0, (event.attendance_total_target || 0) - ((event.attendance_present || 0) + (event.attendance_absent || 0)))} att.
                              </span>
                            </div>

                            {/* Info-Bulle détaillée au survol */}
                            {hoveredAttendanceEventId === event.id && (
                              <div 
                                className="absolute bottom-full right-0 mb-2 w-72 bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/70 z-50 text-xs pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                              >
                                <div className="font-bold text-slate-100 border-b border-slate-700/60 pb-1.5 mb-2 flex items-center justify-between">
                                  <span className="truncate max-w-[170px]">{event.title}</span>
                                  <span className="text-[10px] text-indigo-300 font-bold">{event.attendance_present || 0}/{event.attendance_total_target || 0}</span>
                                </div>

                                {hoverLoadingMap[event.id] && !hoverAttendanceCache[event.id] ? (
                                  <div className="py-2 text-center text-slate-400 text-[11px] flex items-center justify-center gap-1.5">
                                    <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                                    Chargement des présences...
                                  </div>
                                ) : hoverAttendanceCache[event.id] ? (
                                  <div className="space-y-2">
                                    <div>
                                      <div className="flex items-center gap-1 font-bold text-emerald-400 text-[11px] mb-0.5">
                                        <span>🟢 Présents ({hoverAttendanceCache[event.id].presents.length}) :</span>
                                      </div>
                                      {hoverAttendanceCache[event.id].presents.length > 0 ? (
                                        <div className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed">
                                          {hoverAttendanceCache[event.id].presents.map(u => `${u.first_name} ${u.last_name}`).join(', ')}
                                        </div>
                                      ) : (
                                        <p className="text-[10px] italic text-slate-400">Aucun présent</p>
                                      )}
                                    </div>

                                    <div>
                                      <div className="flex items-center gap-1 font-bold text-rose-400 text-[11px] mb-0.5">
                                        <span>🔴 Absents ({hoverAttendanceCache[event.id].absents.length}) :</span>
                                      </div>
                                      {hoverAttendanceCache[event.id].absents.length > 0 ? (
                                        <div className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                                          {hoverAttendanceCache[event.id].absents.map(u => `${u.first_name} ${u.last_name}`).join(', ')}
                                        </div>
                                      ) : (
                                        <p className="text-[10px] italic text-slate-400">Aucun absent</p>
                                      )}
                                    </div>

                                    {hoverAttendanceCache[event.id].unanswered.length > 0 && (
                                      <div className="pt-1.5 border-t border-slate-700/50 text-[10px] text-slate-400">
                                        ⚪ Sans réponse : {hoverAttendanceCache[event.id].unanswered.length} musicien(s)
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-slate-300">
                                    {event.attendance_present || 0} présent(s), {event.attendance_absent || 0} absent(s)
                                  </div>
                                )}

                                <div className="mt-2 pt-1.5 border-t border-slate-700/60 text-[9px] text-indigo-300 text-center font-medium">
                                  Cliquez pour ouvrir la liste nominative complète
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <button 
                              onClick={() => openAttendanceModal(event)} 
                              title="Détail des présences" 
                              className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all duration-300 hover:scale-110 shadow-sm"
                            >
                              <Users size={16} />
                            </button>
                            <button onClick={() => handleEdit(event)} title="Modifier" className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all duration-300 hover:scale-110 shadow-sm"><Edit size={16} /></button>
                            <button onClick={() => confirmDelete(event)} title="Supprimer" className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all duration-300 hover:scale-110 shadow-sm"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex justify-center items-start p-4 pt-24">
            <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border border-white max-h-[calc(100vh-120px)] animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center p-5 bg-white border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                        {editingEvent ? <Edit size={20} /> : <Plus size={20} />}
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                        {editingEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
                    </h2>
                </div>
                <button onClick={cancelEdit} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-5 space-y-5 bg-gradient-to-b from-slate-50 to-white">
                {/* Section: Informations générales */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                        <Info size={16} />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Informations générales</h3>
                    </div>
                    
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
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
                                    <ChevronDown className="text-slate-400" />
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
                            <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description courte..." className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white h-20 resize-none text-sm"></textarea>
                        </div>
                    </div>
                </div>

                {/* Section: Date & Lieu */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                        <MapPin size={16} />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Date & Lieu</h3>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <label className="flex items-center text-sm font-semibold text-slate-700 mb-1.5">
                                    <Calendar size={16} className="mr-2 text-slate-400" /> Date *
                                </label>
                                <input 
                                    type="date" 
                                    name="event_date" 
                                    value={formData.event_date} 
                                    onChange={handleInputChange} 
                                    required 
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white text-sm" 
                                />
                            </div>

                            <div>
                                <label className="flex items-center text-sm font-semibold text-slate-700 mb-1.5">
                                    <Clock size={16} className="mr-2 text-slate-400" /> Heure de début *
                                </label>
                                <input 
                                    type="time" 
                                    name="start_time" 
                                    value={formData.start_time} 
                                    onChange={handleInputChange} 
                                    required 
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white text-sm" 
                                />
                            </div>
                            
                            {formData.event_type === 'repetition' ? (
                              <div>
                                  <label className="flex items-center text-sm font-semibold text-slate-700 mb-1.5">
                                      <Clock size={16} className="mr-2 text-indigo-500" /> Heure de fin <span className="text-[10px] ml-1 text-slate-400 font-normal">(Optionnel)</span>
                                  </label>
                                  <input 
                                      type="time" 
                                      name="end_time" 
                                      value={formData.end_time} 
                                      onChange={handleInputChange} 
                                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white text-sm" 
                                  />
                              </div>
                            ) : null}

                            <div className={formData.event_type === 'repetition' ? "col-span-1 sm:col-span-2 md:col-span-3" : "col-span-1 sm:col-span-2 md:col-span-1"}>
                                <label className="flex items-center text-sm font-semibold text-slate-700 mb-1.5">
                                    <MapPin size={16} className="mr-2 text-slate-400" /> Lieu
                                </label>
                                <input 
                                    type="text" 
                                    name="location" 
                                    value={formData.location} 
                                    onChange={handleInputChange} 
                                    placeholder="Ex: Salle des fêtes" 
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white text-sm" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center text-sm font-semibold text-slate-700 mb-1.5">
                                <Info size={16} className="mr-2 text-slate-400" /> Infos pratiques <span className="text-[10px] ml-1.5 text-slate-400 font-normal">(Membres uniquement)</span>
                            </label>
                            <textarea name="practical_info" value={formData.practical_info} onChange={handleInputChange} placeholder="Horaires de rdv, tenue, etc..." className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white h-20 resize-none text-sm"></textarea>
                        </div>
                    </div>
                </div>

                {/* Section: Affiche / Photo */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-indigo-600 mb-1">
                        <div className="flex items-center space-x-2">
                            <ImageIcon size={16} />
                            <h3 className="text-xs font-bold uppercase tracking-wider">Affiche / Photo de l'événement</h3>
                        </div>
                        <span className="text-[11px] text-slate-400 font-normal">Optionnel</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        {photoPreview ? (
                            <div className="space-y-3">
                                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group aspect-[16/10] max-h-60 shadow-md">
                                    <img 
                                        src={photoPreview.startsWith('blob:') ? photoPreview : getOptimizedImageUrl(photoPreview, 800, 85)} 
                                        alt="Aperçu événement" 
                                        className="w-full h-full object-cover" 
                                    />
                                    <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <label htmlFor="event-photo-upload" className="cursor-pointer px-4 py-2 bg-white text-slate-800 rounded-xl text-xs font-bold shadow-lg hover:bg-slate-50 transition-all flex items-center gap-1.5">
                                            <Upload size={14} /> Changer
                                        </label>
                                        <button 
                                            type="button" 
                                            onClick={removePhoto} 
                                            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-rose-700 transition-all flex items-center gap-1.5"
                                        >
                                            <Trash2 size={14} /> Supprimer
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between px-1 text-xs text-slate-500">
                                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                                        ✓ Photo personnalisée active
                                    </span>
                                    <button 
                                        type="button" 
                                        onClick={removePhoto} 
                                        className="text-rose-500 hover:text-rose-700 font-medium transition"
                                    >
                                        Supprimer et utiliser la photo de l'orchestre
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <label 
                                    htmlFor="event-photo-upload" 
                                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center text-indigo-600 transition-colors mb-2">
                                        <Upload size={20} />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                        Importer une affiche ou photo personnalisée
                                    </span>
                                    <span className="text-xs text-slate-400 mt-1">
                                        Format recommandé 16:10 (PNG, JPG, WEBP)
                                    </span>
                                </label>

                                {(() => {
                                    const firstSelectedOrchestra = orchestras.find(o => formData.orchestra_ids.includes(o.id));
                                    if (firstSelectedOrchestra) {
                                        return (
                                            <div className="flex items-center gap-3 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100/80 text-xs text-indigo-900">
                                                <Info size={16} className="text-indigo-600 flex-shrink-0" />
                                                <span>
                                                    <strong>Photo automatique :</strong> En l'absence de photo dédiée, la photo de l'orchestre <strong>{firstSelectedOrchestra.name}</strong> sera automatiquement affichée sur le site public.
                                                </span>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
                                            <Info size={16} className="text-slate-400 flex-shrink-0" />
                                            <span>
                                                Si aucune photo personnalisée n'est importée, la photo du 1ᵉʳ orchestre sélectionné (ou l'illustration musicale par défaut) sera utilisée sur le site.
                                            </span>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                        <input 
                            type="file" 
                            id="event-photo-upload" 
                            accept="image/*" 
                            onChange={handlePhotoChange} 
                            className="hidden" 
                        />
                    </div>
                </div>

                {/* Section: Orchestres */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                        <Users size={16} />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Orchestres concernés</h3>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
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

                <div className="flex items-center justify-end p-5 bg-white border-t border-slate-100 gap-3 flex-shrink-0">
                  <button type="button" onClick={cancelEdit} className="px-5 py-2.5 text-slate-500 hover:text-slate-700 font-bold transition hover:bg-slate-50 rounded-xl text-sm">
                    Annuler
                  </button>
                  <button type="submit" disabled={submitting} className="px-8 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold transition shadow-lg shadow-indigo-200 flex items-center justify-center disabled:opacity-50 min-w-[140px] text-sm">
                    {submitting ? (
                        <>
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                            Validation...
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
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

        {/* Modal Détail des Présences Nominatif (RSVP) */}
        {selectedAttendanceEvent && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 pt-10">
            <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden border border-white max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
              
              {/* En-tête Modal */}
              <div className="p-6 bg-white border-b border-slate-100 flex-shrink-0 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm border border-indigo-100">
                    <Users size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
                        {selectedAttendanceEvent.event_type}
                      </span>
                      <h2 className="text-xl font-bold text-slate-900">
                        {selectedAttendanceEvent.title}
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center text-indigo-600 font-medium">
                        <Calendar size={13} className="mr-1" />
                        {formatDate(selectedAttendanceEvent.event_date, selectedAttendanceEvent.end_time)}
                      </span>
                      {selectedAttendanceEvent.location && (
                        <span className="flex items-center">
                          <MapPin size={13} className="mr-1 text-rose-400" />
                          {selectedAttendanceEvent.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyRosterToClipboard}
                    disabled={!attendanceDetails}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Copier la feuille de présence dans le presse-papier"
                  >
                    {copiedRoster ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span className="text-emerald-700">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} className="text-slate-500" />
                        <span>Copier la liste</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={closeAttendanceModal}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Corps Modal */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {attendanceLoading ? (
                  <div className="py-20 text-center">
                    <Loader2 size={36} className="animate-spin text-indigo-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-500">Chargement des présences en cours...</p>
                  </div>
                ) : attendanceDetails ? (
                  <>
                    {/* Cartes KPIs Synthèse */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      
                      {/* Présents */}
                      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Présents</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-emerald-600">{attendanceDetails.counts.present}</span>
                          <span className="text-xs font-bold text-emerald-700/80">({attendanceDetails.counts.rate}%)</span>
                        </div>
                      </div>

                      {/* Absents */}
                      <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Absents</span>
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        </div>
                        <span className="text-2xl font-black text-rose-600">{attendanceDetails.counts.absent}</span>
                      </div>

                      {/* Sans réponse */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">En attente</span>
                          <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                        </div>
                        <span className="text-2xl font-black text-slate-600">{attendanceDetails.counts.unanswered}</span>
                      </div>

                      {/* Total */}
                      <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-2xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Musiciens</span>
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        </div>
                        <span className="text-2xl font-black text-indigo-600">{attendanceDetails.total_target}</span>
                      </div>
                    </div>

                    {/* Barre de progression globale */}
                    <div className="space-y-1.5 bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>Répartition des réponses</span>
                        <span>{attendanceDetails.counts.rate}% de confirmation de présence</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-500" 
                          style={{ width: `${attendanceDetails.total_target ? (attendanceDetails.counts.present / attendanceDetails.total_target) * 100 : 0}%` }}
                          title={`${attendanceDetails.counts.present} présents`}
                        />
                        <div 
                          className="bg-rose-500 h-full transition-all duration-500" 
                          style={{ width: `${attendanceDetails.total_target ? (attendanceDetails.counts.absent / attendanceDetails.total_target) * 100 : 0}%` }}
                          title={`${attendanceDetails.counts.absent} absents`}
                        />
                      </div>
                    </div>

                    {/* Onglets et Recherche */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl">
                        <button
                          onClick={() => setAttendanceTab('present')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            attendanceTab === 'present'
                              ? 'bg-white text-emerald-700 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <CheckCircle2 size={13} className="text-emerald-500" />
                          <span>Présents ({attendanceDetails.presents.length})</span>
                        </button>

                        <button
                          onClick={() => setAttendanceTab('absent')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            attendanceTab === 'absent'
                              ? 'bg-white text-rose-700 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <XCircle size={13} className="text-rose-500" />
                          <span>Absents ({attendanceDetails.absents.length})</span>
                        </button>

                        <button
                          onClick={() => setAttendanceTab('unanswered')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            attendanceTab === 'unanswered'
                              ? 'bg-white text-slate-800 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <HelpCircle size={13} className="text-slate-400" />
                          <span>Sans réponse ({attendanceDetails.unanswered.length})</span>
                        </button>
                      </div>

                      {/* Barre de filtre nominatif / instrument */}
                      <div className="relative flex-1 sm:max-w-xs">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={attendanceSearch}
                          onChange={(e) => setAttendanceSearch(e.target.value)}
                          placeholder="Filtrer par nom ou instrument..."
                          className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                        {attendanceSearch && (
                          <button
                            onClick={() => setAttendanceSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Liste des Musiciens filtrés */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
                      {(() => {
                        const currentList = attendanceTab === 'present' 
                          ? attendanceDetails.presents 
                          : attendanceTab === 'absent' 
                            ? attendanceDetails.absents 
                            : attendanceDetails.unanswered;

                        const filtered = currentList.filter(u => {
                          if (!attendanceSearch) return true;
                          const s = attendanceSearch.toLowerCase();
                          return (
                            `${u.first_name} ${u.last_name}`.toLowerCase().includes(s) ||
                            (u.instruments && u.instruments.toLowerCase().includes(s))
                          );
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="py-12 text-center text-slate-400 text-xs">
                              {attendanceSearch ? "Aucun musicien ne correspond à votre recherche." : "Aucun musicien dans cette catégorie."}
                            </div>
                          );
                        }

                        return filtered.map(user => (
                          <div key={user.user_id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                attendanceTab === 'present' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : attendanceTab === 'absent'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-100 text-slate-700'
                              }`}>
                                {user.first_name?.[0]}{user.last_name?.[0]}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-800">
                                  {user.first_name} {user.last_name}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                  {user.instruments ? (
                                    <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-medium border border-indigo-100/60">
                                      🎺 {user.instruments}
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-slate-400 italic">
                                      Aucun instrument renseigné
                                    </span>
                                  )}
                                  {user.orchestras && (
                                    <span className="text-[11px] text-slate-500">
                                      • {user.orchestras}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Horodatage de réponse */}
                            <div className="flex items-center sm:text-right">
                              {user.attendance_updated_at && (
                                <span className="text-[11px] text-slate-400">
                                  Répondu le {new Date(user.attendance_updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </>
                ) : null}
              </div>

              {/* Pied de modal */}
              <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between flex-shrink-0">
                <span className="text-xs text-slate-400">
                  Total : {attendanceDetails?.total_target || 0} musiciens assignés à cet événement
                </span>
                <button
                  onClick={closeAttendanceModal}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Fermer
                </button>
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

