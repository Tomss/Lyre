import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, Music, Search, X, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';

interface Instrument {
  id: string;
  name: string;
  photo_url: string | null;
  teacher: string | null;
  description: string | null;
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
  });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Fonction pour afficher une notification
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Récupérer tous les instruments (MIGRÉ)
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
    if (isAuthenticated && currentUser?.role === 'Admin') {
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
        body: JSON.stringify({ ...formData, photo_url: photoUrl }),
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
        body: JSON.stringify({ ...formData, photo_url: photoUrl }),
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

  // MIGRÉ
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
      fetchInstruments(); // Re-fetch the list
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
    });
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const filteredInstruments = instruments.filter(instrument => {
    const searchLower = searchTerm.toLowerCase();
    return instrument.name.toLowerCase().includes(searchLower) ||
      (instrument.teacher && instrument.teacher.toLowerCase().includes(searchLower)) ||
      (instrument.description && instrument.description.toLowerCase().includes(searchLower));
  });

  if (!isAuthenticated) {
    return <Navigate to="/connexion" />;
  }
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
              <Music className="mr-3 h-8 w-8 text-indigo-600" />
              Gestion des Instruments
            </h1>
            <button onClick={() => { setEditingInstrument(null); setShowAddForm(true); }} className="flex items-center px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
              <Plus className="mr-2 h-5 w-5" />
              Ajouter un instrument
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un instrument..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Instrument List */}
        {loading ? (
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Chargement des instruments...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200/80 overflow-hidden">
            <div className="divide-y divide-gray-200/80">
              {filteredInstruments.map((instrument, index) => (
                <div key={instrument.id} className={`p-4 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-gray-50/50 transition-colors duration-200 ${index !== 0 ? 'mt-2' : ''}`}>
                  <div className="flex items-center flex-grow mb-4 md:mb-0">
                    <img src={instrument.photo_url || 'https://via.placeholder.com/100x100'} alt={instrument.photo_url ? `Photo de ${instrument.name}` : ''} className="w-16 h-16 object-cover rounded-md mr-4" />
                    <div className="flex-grow">
                      <p className="font-bold text-lg text-gray-800">{instrument.name}</p>
                      {instrument.teacher && <p className="text-gray-600 text-sm">Professeur: {instrument.teacher}</p>}
                      <p className="text-gray-600 text-sm truncate">{instrument.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <button onClick={() => handleEdit(instrument)} className="p-2 text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors duration-200"><Edit size={18} /></button>
                    <button onClick={() => confirmDelete(instrument)} className="p-2 text-red-600 bg-red-100 hover:bg-red-200 rounded-full transition-colors duration-200"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-5 border-b">
                <h2 className="text-2xl font-bold text-gray-800">{editingInstrument ? 'Modifier' : 'Ajouter'} un instrument</h2>
                <button onClick={cancelEdit} className="p-2 rounded-full hover:bg-gray-200"><X size={24} /></button>
              </div>
              <form onSubmit={editingInstrument ? handleUpdate : handleCreate} className="flex-grow overflow-y-auto p-6 space-y-4">
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Nom de l'instrument" required className="w-full px-4 py-2 border rounded-lg" />
                <input type="text" name="teacher" value={formData.teacher} onChange={handleInputChange} placeholder="Professeur (optionnel)" className="w-full px-4 py-2 border rounded-lg" />
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description (optionnel)" className="w-full px-4 py-2 border rounded-lg h-24"></textarea>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
                  <div className="flex items-center space-x-4">
                    {photoPreview && <img src={photoPreview} alt="Aperçu" className="w-24 h-24 object-cover rounded-lg" />}
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" id="photo-upload" />
                    <label htmlFor="photo-upload" className="cursor-pointer bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">Choisir une image</label>
                    {photoPreview && <button type="button" onClick={removePhoto} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 /></button>}
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t">
                  <button type="button" onClick={cancelEdit} className="mr-4 px-6 py-2 rounded-lg border hover:bg-gray-100">Annuler</button>
                  <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:bg-blue-300">
                    {loading ? 'Enregistrement...' : (editingInstrument ? 'Mettre à jour' : 'Créer')}
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
              <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer l'instrument <span className="font-bold">{deleteConfirmation.instrument?.name}</span> ?</p>
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
            <div className="flex items-center">
              <CheckCircle size={20} className="mr-2" />
              {notification.message}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminInstruments;
