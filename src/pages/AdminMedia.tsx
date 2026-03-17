import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, Image, Search, X, CheckCircle, ArrowLeft, Upload, File, Music, FileText, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({ isOpen: false, media: null });
  const [notification, setNotification] = useState<Notification>({ show: false, message: '', type: 'success' });
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
    setLoading(true);

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
    setLoading(false);
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
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="relative mb-4">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par titre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Filtrer par type:</span>
            <button onClick={() => setTypeFilter(['album', 'enregistrement', 'journal', 'lyrissimot'])} className={`px-3 py-1 rounded-full text-sm ${typeFilter.length === 4 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Tous</button>
            <button onClick={() => setTypeFilter(['album'])} className={`px-3 py-1 rounded-full text-sm ${typeFilter.length === 1 && typeFilter[0] === 'album' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>Album Photo</button>
            <button onClick={() => setTypeFilter(['enregistrement'])} className={`px-3 py-1 rounded-full text-sm ${typeFilter.length === 1 && typeFilter[0] === 'enregistrement' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>Enregistrement</button>
            <button onClick={() => setTypeFilter(['journal'])} className={`px-3 py-1 rounded-full text-sm ${typeFilter.length === 1 && typeFilter[0] === 'journal' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>Journal</button>
            <button onClick={() => setTypeFilter(['lyrissimot'])} className={`px-3 py-1 rounded-full text-sm ${typeFilter.length === 1 && typeFilter[0] === 'lyrissimot' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>Lyrissimot</button>
          </div>
        </div>

        {/* Media List */}
        {loading ? (
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Chargement des médias...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200/80 overflow-hidden">
            <div className="divide-y divide-gray-200/80">
              {mediaItems.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()) && typeFilter.includes(item.media_type)).map(item => (
                <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-gray-50/50 transition-colors duration-200">
                  <div className="flex items-center flex-1 mb-4 md:mb-0">
                    <div className="w-32 h-20 bg-gray-200 rounded-md mr-4 flex-shrink-0 flex items-center justify-center">
                      <MediaPreview files={item.files} mediaType={item.media_type} />
                    </div>
                    <div className="flex-grow">
                      <p className="font-bold text-lg text-gray-800">{item.title}</p>
                      <p className="text-sm text-gray-500 capitalize">{item.media_type}</p>
                      <p className="text-gray-600 text-sm truncate">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                    <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors duration-200"><Edit size={18} /></button>
                    <button onClick={() => confirmDelete(item)} className="p-2 text-red-600 bg-red-100 hover:bg-red-200 rounded-full transition-colors duration-200"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-5 border-b">
                <h2 className="text-2xl font-bold text-gray-800">{editingMedia ? 'Modifier' : 'Ajouter'} un élément multimédia</h2>
                <button onClick={cancelEdit} className="p-2 rounded-full hover:bg-gray-200"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Titre" required className="w-full px-4 py-2 border rounded-lg" />
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" className="w-full px-4 py-2 border rounded-lg h-24"></textarea>
                <select name="media_type" value={formData.media_type} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg bg-white">
                  <option value="album">Album Photo</option>
                  <option value="enregistrement">Enregistrement Audio</option>
                  <option value="journal">Journal</option>
                  <option value="lyrissimot">Lyrissimot</option>
                </select>
                <input type="date" name="media_date" value={formData.media_date} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
                <div className="flex items-center space-x-2">
                  <input type="checkbox" name="published" checked={formData.published} onChange={handleInputChange} id="published-check" className="h-4 w-4 rounded" />
                  <label htmlFor="published-check">Publié</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleInputChange} id="featured-check" className="h-4 w-4 rounded" />
                  <label htmlFor="featured-check">En vedette</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fichiers</label>
                  <input type="file" multiple onChange={handleFileChange} className="w-full" />
                  <FileUploadPreview files={selectedFiles} onRemove={removeFile} />
                  {editingMedia && <ExistingFilesPreview files={editingMedia.files} onRemove={removeExistingFile} filesToRemove={filesToRemove} />}
                </div>
                <div className="flex justify-end pt-4 border-t">
                  <button type="button" onClick={cancelEdit} className="mr-4 px-6 py-2 rounded-lg border hover:bg-gray-100">Annuler</button>
                  <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:bg-blue-300">
                    {loading ? 'Enregistrement...' : (editingMedia ? 'Mettre à jour' : 'Créer')}
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
