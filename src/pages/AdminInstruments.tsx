import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, Music, Search, X, CheckCircle, ArrowLeft, GraduationCap, Sparkles, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

import { API_URL } from '../config';
import { getOptimizedImageUrl } from '../utils/image';

interface Instrument {
  id: string;
  name: string;
  photo_url: string | null;
  teacher: string | null;
  description: string | null;
  is_class?: boolean | number;
  created_at: string;
}

interface DeleteConfirmation {
  isOpen: boolean;
  instrument: Instrument | null;
}

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

const AdminInstruments = () => {
  const { currentUser, token, isAuthenticated } = useAuth();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'instrument' | 'class'>('all');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState<Instrument | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    isOpen: false,
    instrument: null,
  });
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'success',
  });
  const [formData, setFormData] = useState({
    name: '',
    teacher: '',
    description: '',
    is_class: false,
  });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Gérer le verrouillage du scroll sur les modales
  useEffect(() => {
    if (showAddForm || deleteConfirmation.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddForm, deleteConfirmation.isOpen]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const fetchInstruments = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/instruments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 403) {
        throw new Error('Accès refusé. Vous n\'êtes pas administrateur.');
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setInstruments(data || []);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des instruments:', err);
      showNotification(err.message || 'Erreur lors du chargement des instruments', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated && (currentUser?.role === "Admin" || currentUser?.managedModules?.includes("instruments"))) {
      fetchInstruments();
    }
  }, [isAuthenticated, currentUser, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!file.type.startsWith('image/')) {
        showNotification('Veuillez sélectionner un fichier image', 'error');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showNotification('L\'image ne doit pas dépasser 5MB', 'error');
        return;
      }

      setSelectedPhoto(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);

    try {
      let photoUrl = null;
      if (selectedPhoto) {
        const photoFormData = new FormData();
        photoFormData.append('file', selectedPhoto);

        const uploadResponse = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: photoFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload photo');
        }
        const uploadResult = await uploadResponse.json();
        photoUrl = uploadResult.filePath;
      }

      const response = await fetch(`${API_URL}/instruments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, photo_url: photoUrl, is_class: formData.is_class ? 1 : 0 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur de création');
      }

      const result = await response.json();
      showNotification(result.message);
      cancelEdit();
      fetchInstruments();
    } catch (err: any) {
      console.error('Erreur de création:', err);
      showNotification(err.message, 'error');
    }
    setLoading(false);
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingInstrument || !token) return;
    setLoading(true);

    try {
      let photoUrl = editingInstrument.photo_url;
      if (selectedPhoto) {
        const photoFormData = new FormData();
        photoFormData.append('file', selectedPhoto);

        const uploadResponse = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: photoFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload photo');
        }
        const uploadResult = await uploadResponse.json();
        photoUrl = uploadResult.filePath;
      }

      const response = await fetch(`${API_URL}/instruments/${editingInstrument.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, photo_url: photoUrl, is_class: formData.is_class ? 1 : 0 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur de mise à jour');
      }

      const result = await response.json();
      showNotification(result.message);
      cancelEdit();
      fetchInstruments();
    } catch (err: any) {
      console.error('Erreur de mise à jour:', err);
      showNotification(err.message, 'error');
    }
    setLoading(false);
  };

  const confirmDelete = (instrument: Instrument) => {
    setDeleteConfirmation({ isOpen: true, instrument });
  };

  const handleDelete = async () => {
    if (!deleteConfirmation.instrument || !token) return;

    try {
      const response = await fetch(`${API_URL}/instruments/${deleteConfirmation.instrument.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur de suppression');
      }

      const result = await response.json();
      showNotification(result.message);
      fetchInstruments();
      setDeleteConfirmation({ isOpen: false, instrument: null });
    } catch (err: any) {
      console.error('Erreur de suppression:', err);
      showNotification(err.message, 'error');
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, instrument: null });
  };

  const handleEdit = (instrument: Instrument) => {
    setEditingInstrument(instrument);
    setFormData({
      name: instrument.name,
      teacher: instrument.teacher || '',
      description: instrument.description || '',
      is_class: Boolean(instrument.is_class),
    });
    setSelectedPhoto(null);
    setPhotoPreview(instrument.photo_url);
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingInstrument(null);
    setShowAddForm(false);
    setFormData({
      name: '',
      teacher: '',
      description: '',
      is_class: false,
    });
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const filteredInstruments = instruments.filter(instrument => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = instrument.name.toLowerCase().includes(searchLower) ||
      (instrument.teacher && instrument.teacher.toLowerCase().includes(searchLower)) ||
      (instrument.description && instrument.description.toLowerCase().includes(searchLower));

    if (!matchesSearch) return false;

    if (typeFilter === 'instrument') return !instrument.is_class;
    if (typeFilter === 'class') return Boolean(instrument.is_class);
    return true;
  });

  const countInstruments = instruments.filter(i => !i.is_class).length;
  const countClasses = instruments.filter(i => Boolean(i.is_class)).length;

  if (!isAuthenticated) {
    return <Navigate to="/connexion" />;
  }
  if (currentUser?.role !== 'Admin' && (!currentUser?.managedModules || !currentUser.managedModules.includes('instruments'))) {
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
                <Music size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800">
                  Gestion des Instruments & Classes
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configurez les instruments et classes collectives d'enseignement (éveil, solfège...).
                </p>
              </div>
            </div>
            <button 
              onClick={() => { setEditingInstrument(null); setShowAddForm(true); }} 
              className="flex items-center justify-center px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 font-semibold text-sm"
            >
              <Plus className="mr-2 h-5 w-5" />
              Ajouter un instrument / classe
            </button>
          </div>
        </div>

        {/* Search & Filter Tabs */}
        <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, professeur, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                typeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Tous ({instruments.length})
            </button>
            <button
              onClick={() => setTypeFilter('instrument')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                typeFilter === 'instrument'
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-200'
                  : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              Instruments ({countInstruments})
            </button>
            <button
              onClick={() => setTypeFilter('class')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                typeFilter === 'class'
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Classes & Éveil ({countClasses})
            </button>
          </div>
        </div>

        {/* Instrument List */}
        {loading ? (
          <div className="text-center text-gray-500 py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-sm font-medium text-slate-500">Chargement des données...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            {filteredInstruments.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-slate-600">Aucun résultat trouvé</p>
                <p className="text-xs text-slate-400 mt-1">Essayez un autre mot-clé ou filtre.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredInstruments.map((instrument) => {
                  const isClass = Boolean(instrument.is_class);
                  return (
                    <div key={instrument.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-slate-50/70 transition-colors gap-4">
                      <div className="flex items-center flex-grow min-w-0">
                        {instrument.photo_url ? (
                          <img 
                            src={getOptimizedImageUrl(instrument.photo_url, 120, 80)} 
                            alt={`Photo de ${instrument.name}`} 
                            loading="lazy"
                            decoding="async"
                            className="w-16 h-16 object-cover rounded-2xl mr-4 border border-slate-200 shadow-sm flex-shrink-0" 
                          />
                        ) : (
                          <div className={`w-16 h-16 rounded-2xl mr-4 flex items-center justify-center flex-shrink-0 border ${
                            isClass ? 'bg-purple-50 text-purple-500 border-purple-200' : 'bg-teal-50 text-teal-600 border-teal-200'
                          }`}>
                            {isClass ? <GraduationCap size={26} /> : <Music size={26} />}
                          </div>
                        )}
                        <div className="flex-grow min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-bold text-lg text-slate-900">{instrument.name}</p>
                            {isClass ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                                <GraduationCap className="w-3 h-3" />
                                Classe collective
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-700 border border-teal-200 flex items-center gap-1">
                                <Music className="w-3 h-3" />
                                Instrument
                              </span>
                            )}
                          </div>
                          {instrument.teacher && (
                            <p className="text-slate-600 text-xs font-medium mb-1">
                              <span className="text-slate-400">Professeur :</span> {instrument.teacher}
                            </p>
                          )}
                          {instrument.description && (
                            <p className="text-slate-500 text-xs line-clamp-1">{instrument.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0 self-end md:self-center">
                        <button 
                          onClick={() => handleEdit(instrument)} 
                          className="px-3.5 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Edit size={14} />
                          Modifier
                        </button>
                        <button 
                          onClick={() => confirmDelete(instrument)} 
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-950/80 z-50 flex justify-center items-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-200 my-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{editingInstrument ? 'Modifier' : 'Ajouter'} un élément</h2>
                  <p className="text-xs text-slate-500">Définissez s'il s'agit d'un instrument individuel ou d'une classe collective.</p>
                </div>
                <button onClick={cancelEdit} className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={editingInstrument ? handleUpdate : handleCreate} className="flex-grow overflow-y-auto p-6 space-y-5">
                
                {/* Type Selector (Radio Cards) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Type d'enseignement *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setFormData(prev => ({ ...prev, is_class: false }))}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                        !formData.is_class
                          ? 'border-teal-500 bg-teal-50/50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className={`p-2 rounded-xl flex-shrink-0 ${!formData.is_class ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <Music className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Instrument</p>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5">Trompette, Guitare, Clarinette... Reçoit des partitions.</p>
                      </div>
                    </div>

                    <div
                      onClick={() => setFormData(prev => ({ ...prev, is_class: true }))}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                        formData.is_class
                          ? 'border-purple-500 bg-purple-50/50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className={`p-2 rounded-xl flex-shrink-0 ${formData.is_class ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Classe Collective</p>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5">Éveil Musical, Formation Musicale... Sans partition.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nom de l'instrument ou de la classe *
                  </label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder={formData.is_class ? "Ex: Éveil Musical, Formation Musicale..." : "Ex: Trompette, Flûte Traversière..."} 
                    required 
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                  />
                </div>

                {/* Professeur */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Professeur(s) (optionnel)
                  </label>
                  <input 
                    type="text" 
                    name="teacher" 
                    value={formData.teacher} 
                    onChange={handleInputChange} 
                    placeholder="Ex: Marie-Christine Rémongin, Nicolas Cardot..." 
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Description pédagogique (optionnel)
                  </label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    placeholder="Description du cursus, objectifs pédagogiques, tranches d'âges..." 
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition h-24 resize-none"
                  ></textarea>
                </div>

                {/* Photo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Photo d'illustration</label>
                  <div className="flex items-center space-x-4">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Aperçu" className="w-20 h-20 object-cover rounded-2xl border border-slate-200 shadow-sm" />
                    ) : (
                      <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-200">
                        {formData.is_class ? <GraduationCap size={28} /> : <Music size={28} />}
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" id="photo-upload" />
                      <label htmlFor="photo-upload" className="cursor-pointer bg-slate-100 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-200 transition text-xs font-semibold text-center border border-slate-200">
                        {photoPreview ? 'Changer l\'image' : 'Choisir une image'}
                      </label>
                      {photoPreview && (
                        <button type="button" onClick={removePhoto} className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Supprimer la photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={cancelEdit} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm font-semibold">
                    Annuler
                  </button>
                  <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition font-semibold text-sm disabled:opacity-50">
                    {loading ? 'Enregistrement...' : (editingInstrument ? 'Mettre à jour' : 'Enregistrer')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 bg-slate-950/80 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmer la suppression</h3>
              <p className="text-slate-600 text-sm mb-6">
                Êtes-vous sûr de vouloir supprimer <span className="font-bold text-slate-900">{deleteConfirmation.instrument?.name}</span> ?
              </p>
              <div className="flex justify-end space-x-3">
                <button onClick={cancelDelete} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm font-semibold">
                  Annuler
                </button>
                <button onClick={handleDelete} className="bg-red-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition text-sm font-semibold">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification.show && (
          <div className={`fixed top-5 right-5 p-4 rounded-2xl shadow-xl text-white z-50 text-sm font-semibold flex items-center ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            <CheckCircle size={18} className="mr-2" />
            {notification.message}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminInstruments;
