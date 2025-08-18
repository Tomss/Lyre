import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, Image, Search, X, CheckCircle, ArrowLeft, Upload, File, Music, FileText, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import FileUploadPreview from '../components/FileUploadPreview';
import MediaPreview from '../components/MediaPreview';
import ExistingFilesPreview from '../components/ExistingFilesPreview';

interface MediaItem {
  id: string;
  title: string;
  description: string | null;
  media_type: 'album' | 'enregistrement' | 'journal' | 'lyrissimot';
  published: boolean;
  is_featured: boolean;
  created_at: string;
  media_files: MediaFile[];
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface MediaFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: 'image' | 'video' | 'audio' | 'pdf';
  file_size: number;
  mime_type: string;
  alt_text: string | null;
  sort_order: number;
}

interface DeleteConfirmation {
  isOpen: boolean;
  media: MediaItem | null;
}

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

const AdminMedia = () => {
  const { profile } = useAuth();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>(['album', 'enregistrement', 'journal', 'lyrissimot']);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    isOpen: false,
    media: null,
  });
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'success',
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    media_type: 'album' as 'album' | 'enregistrement' | 'journal' | 'lyrissimot',
    published: true,
    is_featured: false,
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);

  // Fonction pour afficher une notification
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Récupérer tous les médias
  const fetchMedia = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-media?published=false`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMediaItems(data || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des médias:', err);
      showNotification('Erreur lors du chargement des médias', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (profile?.role === 'Admin' || profile?.role === 'Gestionnaire') {
      fetchMedia();
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Pour les lyrissimots, limiter à 1 seul fichier PDF
      if (formData.media_type === 'lyrissimot') {
        if (files.length > 1) {
          showNotification('Un seul fichier PDF autorisé pour les Lyrissimots', 'error');
          return;
        }
        if (files[0] && files[0].type !== 'application/pdf') {
          showNotification('Seuls les fichiers PDF sont autorisés pour les Lyrissimots', 'error');
          return;
        }
      }
      
      setSelectedFiles(files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (fileId: string) => {
    setFilesToRemove(prev => [...prev, fileId]);
  };
  
  // Upload réel des fichiers vers Supabase Storage
  const uploadFiles = async (files: File[]): Promise<any[]> => {
    const uploadedFiles = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `media/${fileName}`;
      
      try {
        // Upload du fichier vers Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media-files')
          .upload(filePath, file);
          
        if (uploadError) {
          console.error('Erreur upload:', uploadError);
          throw uploadError;
        }
        
        // Récupération de l'URL publique
        const { data: urlData } = supabase.storage
          .from('media-files')
          .getPublicUrl(filePath);
          
        uploadedFiles.push({
          file_name: file.name,
          file_path: urlData.publicUrl,
          file_type: file.type.startsWith('image/') ? 'image' : 
                     file.type.startsWith('video/') ? 'video' :
                     file.type.startsWith('audio/') ? 'audio' : 'pdf',
          file_size: file.size,
          mime_type: file.type,
          alt_text: null,
          sort_order: i
        });
        
      } catch (error) {
        console.error(`Erreur lors de l'upload de ${file.name}:`, error);
        showNotification(`Erreur lors de l'upload de ${file.name}`, 'error');
      }
    }
    
    return uploadedFiles;
  };

  // Créer un média
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let uploadedFiles = [];
      if (selectedFiles.length > 0) {
        uploadedFiles = await uploadFiles(selectedFiles);
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          ...formData,
          files: uploadedFiles,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      showNotification(result.message);
      cancelEdit();
      fetchMedia();
    } catch (err) {
      console.error('Erreur de création:', err);
      showNotification('Erreur de création: ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
    }
    setLoading(false);
  };

  // Mettre à jour un média
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingMedia) return;
    setLoading(true);

    try {
      let uploadedFiles = undefined;
      if (selectedFiles.length > 0) {
        uploadedFiles = await uploadFiles(selectedFiles);
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          id: editingMedia.id,
          ...formData,
          files: uploadedFiles,
          filesToRemove: filesToRemove,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      showNotification(result.message);
      cancelEdit();
      fetchMedia();
    } catch (err) {
      console.error('Erreur de mise à jour:', err);
      showNotification('Erreur de mise à jour: ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
    }
    setLoading(false);
  };

  // Supprimer un média
  const confirmDelete = (media: MediaItem) => {
    setDeleteConfirmation({
      isOpen: true,
      media: media,
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirmation.media) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          id: deleteConfirmation.media.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      showNotification(result.message);
      fetchMedia();
      setDeleteConfirmation({ isOpen: false, media: null });
    } catch (err) {
      console.error('Erreur de suppression:', err);
      showNotification('Erreur de suppression: ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, media: null });
  };

  // Préparer l'édition
  const handleEdit = (media: MediaItem) => {
    setEditingMedia(media);
    setFormData({
      title: media.title,
      description: media.description || '',
      media_type: media.media_type,
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
    setFormData({
      title: '',
      description: '',
      media_type: 'album',
      published: true,
      is_featured: false,
    });
    setSelectedFiles([]);
    setFilesToRemove([]);
  };

  // Fonctions utilitaires pour les types de fichiers
  const getAcceptedFileTypes = (mediaType: string) => {
    switch (mediaType) {
      case 'album': return 'image/*,video/*';
      case 'enregistrement': return 'audio/*';
      case 'journal': return 'image/*,.pdf';
      case 'lyrissimot': return '.pdf';
      default: return 'image/*,video/*,audio/*,.pdf';
    }
  };

  const getFileInputLabel = (mediaType: string) => {
    switch (mediaType) {
      case 'album': return 'Photos et vidéos';
      case 'enregistrement': return 'Fichiers audio';
      case 'journal': return 'Image ou PDF de l\'article';
      case 'lyrissimot': return 'Fichier PDF';
      default: return 'Fichiers';
    }
  };

  const getFileInputText = (mediaType: string) => {
    switch (mediaType) {
      case 'album': return 'Sélectionner photos et vidéos';
      case 'enregistrement': return 'Sélectionner fichiers audio';
      case 'journal': return 'Sélectionner image ou PDF';
      case 'lyrissimot': return 'Sélectionner UN seul PDF';
      default: return 'Sélectionner des fichiers';
    }
  };

  const getFileTypeDescription = (mediaType: string) => {
    switch (mediaType) {
      case 'album': return 'Images (JPG, PNG, GIF) et vidéos (MP4, MOV)';
      case 'enregistrement': return 'Fichiers audio (MP3, WAV, M4A)';
      case 'journal': return 'Image de l\'article ou PDF';
      case 'lyrissimot': return 'UN SEUL document PDF uniquement';
      default: return 'Tous types de fichiers';
    }
  };
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'album': return 'bg-blue-100 text-blue-800';
      case 'enregistrement': return 'bg-green-100 text-green-800';
      case 'journal': return 'bg-yellow-100 text-yellow-800';
      case 'lyrissimot': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'album': return Camera;
      case 'enregistrement': return Music;
      case 'journal': return FileText;
      case 'lyrissimot': return File;
      default: return Image;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'album': return 'Album';
      case 'enregistrement': return 'Enregistrement';
      case 'journal': return 'Journal';
      case 'lyrissimot': return 'Lyrissimot';
      default: return type;
    }
  };

  const toggleTypeFilter = (type: string) => {
    setTypeFilter(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Filtrer les médias
  const filteredMedia = mediaItems.filter(media => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      media.title.toLowerCase().includes(searchLower) ||
      (media.description && media.description.toLowerCase().includes(searchLower))
    );
    
    const matchesType = typeFilter.includes(media.media_type);
    
    return matchesSearch && matchesType;
  });

  if (profile && !['Admin', 'Gestionnaire'].includes(profile.role)) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="font-inter pt-20 pb-20 min-h-screen bg-gray-50">
      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-24 right-4 z-50 animate-fade-in">
          <div className={`flex items-center space-x-3 px-6 py-4 rounded-lg shadow-lg border ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <X className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link
                to="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-2"
                title="Retour au dashboard"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </Link>
              <div className="bg-primary/10 p-3 rounded-lg">
                <Image className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="font-poppins font-bold text-3xl text-dark">
                  Gestion des médias
                </h1>
                <p className="font-inter text-gray-600">
                  Gérez les albums, enregistrements, journaux et lyrissimots
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span>Ajouter un média</span>
            </button>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-4">
            <span className="flex items-center space-x-1">
              <Image className="h-4 w-4" />
              <span>{filteredMedia.length} média{filteredMedia.length > 1 ? 's' : ''} {searchTerm && `sur ${mediaItems.length}`}</span>
            </span>
          </div>
        </div>

        {/* Formulaire d'ajout/modification (Modal) */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      {editingMedia ? <Edit className="h-6 w-6 text-primary" /> : <Plus className="h-6 w-6 text-primary" />}
                    </div>
                    <h2 className="font-poppins font-semibold text-xl text-dark">
                      {editingMedia ? 'Modifier le média' : 'Ajouter un média'}
                    </h2>
                  </div>
                  <button
                    onClick={cancelEdit}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={editingMedia ? handleUpdate : handleCreate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">
                        Titre du média
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Ex: Concert de printemps..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">
                        Type de média
                      </label>
                      <select
                        name="media_type"
                        value={formData.media_type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="album">Album</option>
                        <option value="enregistrement">Enregistrement</option>
                        <option value="journal">Journal</option>
                        <option value="lyrissimot">Lyrissimot</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Description (optionnel)
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                      placeholder="Description du média..."
                    />
                  </div>

                  {/* Fichiers existants lors de la modification */}
                  {editingMedia && editingMedia.media_files && (
                    <ExistingFilesPreview
                      files={editingMedia.media_files.filter(f => !filesToRemove.includes(f.id))}
                      onRemove={removeExistingFile}
                      className="mb-4"
                    />
                  )}

                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      {editingMedia ? 'Ajouter de nouveaux fichiers (optionnel)' : getFileInputLabel(formData.media_type)}
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <input
                        type="file"
                        multiple={formData.media_type !== 'lyrissimot'}
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                        accept={getAcceptedFileTypes(formData.media_type)}
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer text-primary hover:text-primary/80 font-medium"
                      >
                        {editingMedia ? 'Cliquez pour ajouter des fichiers' : getFileInputText(formData.media_type)}
                      </label>
                      <p className="text-sm text-gray-500 mt-2">
                        {getFileTypeDescription(formData.media_type)}
                      </p>
                    </div>
                    
                    {/* Prévisualisation des nouveaux fichiers */}
                    <FileUploadPreview
                      files={selectedFiles}
                      onRemove={removeFile}
                      className="mt-4"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="published"
                        checked={formData.published}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-primary focus:ring-primary mr-2"
                      />
                      <label className="text-sm font-medium text-dark">
                        Publié
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-primary focus:ring-primary mr-2"
                      />
                      <label className="text-sm font-medium text-dark">
                        Mis en avant
                      </label>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      {loading ? 'En cours...' : (editingMedia ? 'Mettre à jour' : 'Créer')}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-dark rounded-lg transition-all duration-200"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {deleteConfirmation.isOpen && deleteConfirmation.media && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-red-100 p-3 rounded-full">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-semibold text-lg text-dark">
                      Confirmer la suppression
                    </h3>
                    <p className="text-sm text-gray-600">
                      Cette action est irréversible
                    </p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700">
                    Êtes-vous sûr de vouloir supprimer le média{' '}
                    <span className="font-semibold text-dark">
                      {deleteConfirmation.media.title}
                    </span>{' '}
                    ?
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleDelete}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Supprimer définitivement
                  </button>
                  <button
                    onClick={cancelDelete}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-dark font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liste des médias */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-poppins font-semibold text-lg text-dark">
                Liste des médias
              </h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher un média..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-64"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Filtres par type */}
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              {[
                { key: 'album', label: 'Albums', icon: Camera, color: 'blue' },
                { key: 'enregistrement', label: 'Enregistrements', icon: Music, color: 'green' },
                { key: 'journal', label: 'Journaux', icon: FileText, color: 'yellow' },
                { key: 'lyrissimot', label: 'Lyrissimots', icon: File, color: 'purple' }
              ].map(({ key, label, icon: Icon, color }) => (
                <button
                  key={key}
                  onClick={() => toggleTypeFilter(key)}
                  className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    typeFilter.includes(key)
                      ? `bg-${color}-100 text-${color}-800 border border-${color}-200`
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement...</p>
            </div>
          ) : filteredMedia.length === 0 && searchTerm ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>Aucun média trouvé pour "{searchTerm}"</p>
              <button onClick={() => setSearchTerm('')} className="text-primary hover:text-primary/80 mt-2">Effacer la recherche</button>
            </div>
          ) : mediaItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Image className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>Aucun média trouvé</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredMedia.map((media) => {
                const TypeIcon = getTypeIcon(media.media_type);
                return (
                  <div key={media.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-6 flex-1">
                        {/* Prévisualisation visuelle */}
                        <div className="flex-shrink-0">
                          <MediaPreview
                            files={media.media_files}
                            mediaType={media.media_type}
                            className="w-24 h-16"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-dark text-lg">
                              {media.title}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(media.media_type)}`}>
                              <TypeIcon className="h-3 w-3 mr-1" />
                              {getTypeLabel(media.media_type)}
                            </span>
                            {media.is_featured && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                ⭐ Mis en avant
                              </span>
                            )}
                            {!media.published && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                🚫 Non publié
                              </span>
                            )}
                          </div>
                          
                          {media.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {media.description}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                            <span>{media.media_files.length} fichier{media.media_files.length > 1 ? 's' : ''}</span>
                            <span>{new Date(media.created_at).toLocaleDateString('fr-FR')}</span>
                            {media.profiles && (
                              <span>Par {media.profiles.first_name} {media.profiles.last_name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(media)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Modifier"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => confirmDelete(media)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Supprimer"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMedia;