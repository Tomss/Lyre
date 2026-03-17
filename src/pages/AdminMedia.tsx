import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, Image, Search, X, ArrowLeft, ChevronRight, Star, Eye, EyeOff, FileText, Music, Play, LayoutGrid, Calendar, Info, AlignLeft, Globe, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import FileUploadPreview from '../components/FileUploadPreview';
import MediaPreview from '../components/MediaPreview';
import ExistingFilesPreview from '../components/ExistingFilesPreview';

import { API_URL } from '../config';

// Interfaces
interface MediaFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: 'image' | 'video' | 'audio' | 'pdf';
  file_size: number;
  alt_text: string | null;
  sort_order: number;
}

interface MediaItem {
  id: string;
  title: string;
  description: string | null;
  media_type: 'album' | 'enregistrement' | 'journal' | 'lyrissimot';
  published: boolean;
  is_featured: boolean;
  media_date: string | null;
  created_at: string;
  files: MediaFile[];
}

interface DeleteConfirmation { isOpen: boolean; media: MediaItem | null; }
interface Notification { show: boolean; message: string; type: 'success' | 'error'; }

const AdminMedia = () => {
  const { currentUser, token, isAuthenticated } = useAuth();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>(['album', 'enregistrement', 'journal', 'lyrissimot']);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({ isOpen: false, media: null });
  const [notification, setNotification] = useState<Notification>({ show: false, message: '', type: 'success' });
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['album', 'enregistrement', 'journal', 'lyrissimot']));
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    media_type: 'album' as MediaItem['media_type'],
    media_date: '',
    published: true,
    is_featured: false,
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
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

  const fetchMedia = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/media`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Erreur de chargement des medias');
      const data = await response.json();
      setMediaItems(data || []);
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated && (currentUser?.role === 'Admin' || currentUser?.role === 'Gestionnaire')) {
      fetchMedia();
    }
  }, [isAuthenticated, currentUser, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    setFormData(prev => ({ ...prev, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (formData.media_type === 'lyrissimot') {
        if (files.length > 1 || (files[0] && files[0].type !== 'application/pdf')) {
          return showNotification('Un seul fichier PDF est autorise pour les Lyrissimots', 'error');
        }
      }
      setSelectedFiles(files);
    }
  };

  const removeFile = (index: number) => setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  const removeExistingFile = (fileId: string) => setFilesToRemove(prev => [...prev, fileId]);

  const uploadFiles = async (files: File[]): Promise<any[]> => {
    const uploadedFiles = await Promise.all(files.map(async (file, index) => {
      try {
        const fileFormData = new FormData();
        fileFormData.append('file', file);
        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: fileFormData,
        });
        if (!response.ok) throw new Error(`Echec de l'upload pour ${file.name}`);
        const result = await response.json();
        return {
          fileName: file.name,
          filePath: result.filePath,
          fileType: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'document',
          fileSize: file.size,
          altText: null,
          sortOrder: index,
        };
      } catch (error) {
        showNotification(`Erreur d'upload pour ${file.name}`, 'error');
        return null;
      }
    }));
    return uploadedFiles.filter(f => f !== null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);

    try {
      let uploadedFilesData: any[] = [];
      if (selectedFiles.length > 0) {
        uploadedFilesData = await uploadFiles(selectedFiles);
      }

      const isUpdating = !!editingMedia;
      const url = isUpdating ? `${API_URL}/media/${editingMedia.id}` : `${API_URL}/media`;
      const method = isUpdating ? 'PUT' : 'POST';

      const existingFiles = editingMedia?.files.filter(f => !filesToRemove.includes(f.id)).map((f, index) => ({ ...f, sortOrder: index })) || [];
      const finalFiles = [...existingFiles, ...uploadedFilesData].map((f, index) => ({ ...f, sortOrder: index }));

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, files: finalFiles }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Une erreur est survenue');
      }

      const result = await response.json();
      showNotification(result.message);
      cancelEdit();
      fetchMedia();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirmation.media || !token) return;
    try {
      const response = await fetch(`${API_URL}/media/${deleteConfirmation.media.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur de suppression');
      }
      const result = await response.json();
      showNotification(result.message);
      fetchMedia();
      setDeleteConfirmation({ isOpen: false, media: null });
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleEdit = (media: MediaItem) => {
    setEditingMedia(media);
    setFormData({
      title: media.title,
      description: media.description || '',
      media_type: media.media_type,
      media_date: media.media_date ? new Date(media.media_date).toISOString().split('T')[0] : '',
      published: media.published,
      is_featured: media.is_featured,
    });
    setSelectedFiles([]);
    setFilesToRemove([]);
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingMedia(null);
    setShowAddForm(false);
    setFormData({ title: '', description: '', media_type: 'album', media_date: '', published: true, is_featured: false });
    setSelectedFiles([]);
    setFilesToRemove([]);
  };

  const confirmDelete = (media: MediaItem) => setDeleteConfirmation({ isOpen: true, media });
  const cancelDelete = () => setDeleteConfirmation({ isOpen: false, media: null });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'album': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'enregistrement': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'journal': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'lyrissimot': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'album': return Image;
      case 'enregistrement': return Music;
      case 'journal': return FileText;
      case 'lyrissimot': return Play;
      default: return Image;
    }
  };

  const toggleTypeExpansion = (type: string) => {
    setExpandedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) newSet.delete(type);
      else newSet.add(type);
      return newSet;
    });
  };

  const expandAllTypes = () => setExpandedTypes(new Set(['album', 'enregistrement', 'journal', 'lyrissimot']));
  const collapseAllTypes = () => setExpandedTypes(new Set());

  // Group media by type
  const mediaByType = mediaItems
    .filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()) && typeFilter.includes(item.media_type))
    .sort((a, b) => new Date(b.media_date || b.created_at).getTime() - new Date(a.media_date || a.created_at).getTime())
    .reduce((acc, item) => {
      if (!acc[item.media_type]) acc[item.media_type] = [];
      acc[item.media_type].push(item);
      return acc;
    }, {} as Record<string, MediaItem[]>);

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
              <Image className="mr-3 h-8 w-8 text-indigo-600" />
              Gestion des Médias
            </h1>
            <button onClick={() => { setEditingMedia(null); setShowAddForm(true); }} className="flex items-center px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
              <Plus className="mr-2 h-5 w-5" />
              Ajouter un média
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          {/* Row 1: Search Bar */}
          <div>
            <label htmlFor="search" className="block text-sm font-semibold text-slate-700 mb-2">Rechercher un média</label>
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="search"
                placeholder="Rechercher par titre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          {/* Row 2: Type Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center">
                <LayoutGrid className="w-4 h-4 mr-2 text-indigo-500" /> Filtrer par type
              </label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setTypeFilter(['album', 'enregistrement', 'journal', 'lyrissimot'])} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${typeFilter.length === 4 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tous</button>
                <button onClick={() => setTypeFilter(['album'])} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${typeFilter.length === 1 && typeFilter[0] === 'album' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Albums</button>
                <button onClick={() => setTypeFilter(['enregistrement'])} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${typeFilter.length === 1 && typeFilter[0] === 'enregistrement' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Enregistrements</button>
                <button onClick={() => setTypeFilter(['journal'])} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${typeFilter.length === 1 && typeFilter[0] === 'journal' ? 'bg-amber-500 text-white shadow-md shadow-amber-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Journaux</button>
                <button onClick={() => setTypeFilter(['lyrissimot'])} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${typeFilter.length === 1 && typeFilter[0] === 'lyrissimot' ? 'bg-rose-500 text-white shadow-md shadow-rose-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Lyrissimots</button>
              </div>
            </div>
            <div className="lg:border-l lg:pl-6 border-slate-100 flex items-center">
              <div className="flex items-center space-x-2 ml-auto">
                <button onClick={expandAllTypes} className="text-sm bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition">Tout déplier</button>
                <button onClick={collapseAllTypes} className="text-sm bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition">Tout replier</button>
              </div>
            </div>
          </div>
        </div>

        {/* Media List */}
        {loading ? (
          <div className="text-center text-gray-500 py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 font-medium">Chargement des médias...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(mediaByType).map(([type, items]) => (
              <div key={type} className="bg-white rounded-xl shadow-lg border border-gray-200/80 overflow-hidden">
                <div onClick={() => toggleTypeExpansion(type)} className={`p-5 flex justify-between items-center cursor-pointer border-b border-gray-200/80 transition-colors ${getTypeColor(type).replace('text-', 'bg-').replace('-800', '-200')} hover:bg-gray-100/50`}>
                  <div className="flex items-center">
                    {React.createElement(getTypeIcon(type), { className: `h-8 w-8 mr-4 ${getTypeColor(type).split(' ')[1].replace('-800', '-600')}` })}
                    <h2 className={`text-2xl font-bold ${getTypeColor(type).split(' ')[1].replace('-800', '-900')}`}>
                      {type === 'album' ? 'Albums Photos' : type === 'enregistrement' ? 'Enregistrements' : type === 'journal' ? 'Journaux' : 'Lyrissimots'} <span className="text-lg font-normal">({items.length})</span>
                    </h2>
                  </div>
                  <ChevronRight className={`transform transition-transform duration-300 ${expandedTypes.has(type) ? 'rotate-90' : ''}`} />
                </div>
                {expandedTypes.has(type) && (
                  <div className="divide-y divide-gray-200/80">
                    {items.map(item => (
                      <div key={item.id} className={`p-4 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-gray-50/50 transition-colors duration-200 border-l-4 ${getTypeColor(item.media_type).replace('bg', 'border').replace('-100', '-500')}`}>
                        <div className="flex items-center flex-1 mb-4 md:mb-0">
                          <div className="w-40 h-24 bg-slate-100 rounded-xl mr-6 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200 shadow-inner group relative">
                            <MediaPreview files={item.files} mediaType={item.media_type} />
                            <div className="absolute top-1 right-1">
                                {item.is_featured && <div className="bg-amber-100 text-amber-600 p-1 rounded-full border border-amber-200 shadow-sm"><Star size={12} fill="currentColor" /></div>}
                            </div>
                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] font-bold text-white uppercase tracking-wider">
                                {item.files.length} {item.files.length > 1 ? 'fichiers' : 'fichier'}
                            </div>
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center mb-1">
                              <p className="font-bold text-lg text-gray-800 leading-tight mr-3">{item.title}</p>
                              <div className="flex items-center space-x-2">
                                {item.published ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        <Eye size={10} className="mr-1" /> Publié
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                                        <EyeOff size={10} className="mr-1" /> Brouillon
                                    </span>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm line-clamp-2 max-w-xl mb-2">{item.description}</p>
                            <div className="flex items-center text-xs text-slate-400 font-medium">
                                <Calendar size={12} className="mr-1" /> {item.media_date ? new Date(item.media_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date non définie'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 flex-shrink-0">
                          <button onClick={() => handleEdit(item)} title="Modifier" className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors duration-200 shadow-sm border border-indigo-100"><Edit size={18} /></button>
                          <button onClick={() => confirmDelete(item)} title="Supprimer" className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors duration-200 shadow-sm border border-rose-100"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {Object.keys(mediaByType).length === 0 && (
                <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
                    <LayoutGrid size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium tracking-tight text-lg">Aucun média trouvé pour cette recherche.</p>
                </div>
            )}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 flex justify-center items-start p-4 pt-24">
            <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden border border-white max-h-[calc(100vh-120px)] animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center p-6 bg-white border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                        {editingMedia ? <Edit size={24} /> : <Plus size={24} />}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                        {editingMedia ? 'Modifier le média' : 'Nouveau média'}
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
                                <FileText size={16} className="mr-2 text-slate-400" /> Titre de l'album ou média *
                            </label>
                            <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Ex: Concert du 14 Juillet" required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white" />
                        </div>

                        <div>
                            <label className="flex items-center text-sm font-semibold text-slate-700 mb-1.5">
                                <AlignLeft size={16} className="mr-2 text-slate-400" /> Description
                            </label>
                            <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Une courte description du contenu..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white h-24 resize-none"></textarea>
                        </div>
                    </div>
                </div>

                {/* Section: Type & Date */}
                <div className="space-y-5">
                    <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                        <LayoutGrid size={18} />
                        <h3 className="text-sm font-bold uppercase tracking-wider">Type & Date</h3>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="flex items-center text-sm font-semibold text-slate-700 mb-1.5">
                                    <LayoutGrid size={16} className="mr-2 text-slate-400" /> Type de média *
                                </label>
                                <div className="relative">
                                    <select name="media_type" value={formData.media_type} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white appearance-none">
                                        <option value="album">📸 Album Photo</option>
                                        <option value="enregistrement">🎧 Enregistrement Audio</option>
                                        <option value="journal">📰 Journal</option>
                                        <option value="lyrissimot">🎼 Lyrissimot</option>
                                    </select>
                                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center text-sm font-semibold text-slate-700 mb-1.5">
                                    <Calendar size={16} className="mr-2 text-slate-400" /> Date associée *
                                </label>
                                <input type="date" name="media_date" value={formData.media_date} onChange={handleInputChange} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: Visibilité & En vedette */}
                <div className="space-y-5">
                    <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                        <Globe size={18} />
                        <h3 className="text-sm font-bold uppercase tracking-wider">Visibilité & En vedette</h3>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all">
                        <label className="flex items-center space-x-3 cursor-pointer group flex-1 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.published ? 'bg-emerald-100 text-emerald-600 shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                                {formData.published ? <Eye size={18} /> : <EyeOff size={18} />}
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-center justify-between">
                                    <span className={`font-semibold text-sm ${formData.published ? 'text-slate-800' : 'text-slate-500'}`}>Publier</span>
                                    <input type="checkbox" name="published" checked={formData.published} onChange={handleInputChange} className="sr-only" />
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${formData.published ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${formData.published ? 'translate-x-[18px]' : 'translate-x-0.5'}`}></div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500">Visible par tous</p>
                            </div>
                        </label>

                        <div className="hidden sm:block w-px bg-slate-100 my-2"></div>

                        <label className="flex items-center space-x-3 cursor-pointer group flex-1 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.is_featured ? 'bg-amber-100 text-amber-600 shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                                <Star size={18} fill={formData.is_featured ? "currentColor" : "none"} />
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-center justify-between">
                                    <span className={`font-semibold text-sm ${formData.is_featured ? 'text-slate-800' : 'text-slate-500'}`}>En vedette</span>
                                    <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleInputChange} className="sr-only" />
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${formData.is_featured ? 'bg-amber-500' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${formData.is_featured ? 'translate-x-[18px]' : 'translate-x-0.5'}`}></div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500">Mise en avant accueil</p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Section: Gestion des fichiers */}
                <div className="space-y-5">
                    <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                        <Users size={18} />
                        <h3 className="text-sm font-bold uppercase tracking-wider">Gestion des fichiers</h3>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                        <div>
                            <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                                <Plus size={16} className="mr-2 text-slate-400" /> Sélectionner des fichiers *
                            </label>
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-indigo-400 transition-colors group cursor-pointer relative bg-slate-50/50">
                                <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                                        <Plus size={24} />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700">Cliquez ou glissez vos fichiers ici</p>
                                    <p className="text-xs text-slate-500 mt-1">Photos, Vidéos, Audio ou PDF (Lyrissimots)</p>
                                </div>
                            </div>
                        </div>
                        
                        {selectedFiles.length > 0 && (
                            <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                                <h4 className="flex items-center text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">
                                    <div className="w-1 h-3 bg-indigo-600 mr-2 rounded-full"></div>
                                    Nouveaux fichiers ({selectedFiles.length})
                                </h4>
                                <FileUploadPreview files={selectedFiles} onRemove={removeFile} />
                            </div>
                        )}

                        {editingMedia && editingMedia.files.length > filesToRemove.length && (
                            <div className="pt-2">
                                <h4 className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                    <div className="w-1 h-3 bg-slate-300 mr-2 rounded-full"></div>
                                    Fichiers existants
                                </h4>
                                <ExistingFilesPreview files={editingMedia.files.filter(f => !filesToRemove.includes(f.id))} onRemove={removeExistingFile} />
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-end p-6 bg-white border-t border-slate-100 gap-3 flex-shrink-0">
                  <button type="button" onClick={cancelEdit} className="px-6 py-3 text-slate-500 hover:text-slate-700 font-bold transition hover:bg-slate-50 rounded-xl">
                    Annuler
                  </button>
                  <button type="submit" disabled={submitting} className="px-10 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold transition shadow-lg shadow-indigo-200 flex items-center justify-center disabled:opacity-50 min-w-[160px]">
                    {submitting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Envoi...
                        </>
                    ) : (editingMedia ? 'Mettre à jour' : 'Créer l\'album')}
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
              <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer l'élément <span className="font-bold">{deleteConfirmation.media?.title}</span> ?</p>
              <div className="flex justify-end space-x-4">
                <button onClick={cancelDelete} className="px-6 py-2 rounded-lg border hover:bg-gray-100">Annuler</button>
                <button onClick={handleDelete} className="bg-red-600 text-white px-6 py-2 rounded-lg shadow hover:bg-red-700">Supprimer</button>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification.show && (
          <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {notification.message}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminMedia;
