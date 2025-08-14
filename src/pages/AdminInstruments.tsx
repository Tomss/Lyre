import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, Music, Search, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

interface Instrument {
  id: string;
  name: string;
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
  const { profile } = useAuth();
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
  });

  // Fonction pour afficher une notification
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Récupérer tous les instruments
  const fetchInstruments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-instruments`, {
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
      setInstruments(data || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des instruments:', err);
      showNotification('Erreur lors du chargement des instruments', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (profile?.role === 'Admin') {
      fetchInstruments();
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Créer un instrument
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-instruments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          name: formData.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      showNotification(result.message);
      cancelEdit();
      fetchInstruments();
    } catch (err) {
      console.error('Erreur de création:', err);
      showNotification('Erreur de création: ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
    }
    setLoading(false);
  };

  // Mettre à jour un instrument
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingInstrument) return;
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-instruments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          id: editingInstrument.id,
          name: formData.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      showNotification(result.message);
      cancelEdit();
      fetchInstruments();
    } catch (err) {
      console.error('Erreur de mise à jour:', err);
      showNotification('Erreur de mise à jour: ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
    }
    setLoading(false);
  };

  // Supprimer un instrument
  const confirmDelete = (instrument: Instrument) => {
    setDeleteConfirmation({
      isOpen: true,
      instrument: instrument,
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirmation.instrument) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-instruments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          id: deleteConfirmation.instrument.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      showNotification(result.message);
      fetchInstruments();
      setDeleteConfirmation({ isOpen: false, instrument: null });
    } catch (err) {
      console.error('Erreur de suppression:', err);
      showNotification('Erreur de suppression: ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, instrument: null });
  };

  // Préparer l'édition
  const handleEdit = (instrument: Instrument) => {
    setEditingInstrument(instrument);
    setFormData({
      name: instrument.name,
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingInstrument(null);
    setShowAddForm(false);
    setFormData({
      name: '',
    });
  };

  // Filtrer les instruments selon le terme de recherche
  const filteredInstruments = instruments.filter(instrument => {
    const searchLower = searchTerm.toLowerCase();
    return instrument.name.toLowerCase().includes(searchLower);
  });

  if (profile && profile.role !== 'Admin') {
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

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Music className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="font-poppins font-bold text-3xl text-dark">
                  Gestion des instruments
                </h1>
                <p className="font-inter text-gray-600">
                  Gérez les instruments disponibles dans l'école
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span>Ajouter un instrument</span>
            </button>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-4">
            <span className="flex items-center space-x-1">
              <Music className="h-4 w-4" />
              <span>{filteredInstruments.length} instrument{filteredInstruments.length > 1 ? 's' : ''} {searchTerm && `sur ${instruments.length}`}</span>
            </span>
          </div>
        </div>

        {/* Formulaire d'ajout/modification (Modal) */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      {editingInstrument ? <Edit className="h-6 w-6 text-primary" /> : <Plus className="h-6 w-6 text-primary" />}
                    </div>
                    <h2 className="font-poppins font-semibold text-xl text-dark">
                      {editingInstrument ? 'Modifier l\'instrument' : 'Ajouter un instrument'}
                    </h2>
                  </div>
                  <button
                    onClick={cancelEdit}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={editingInstrument ? handleUpdate : handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Nom de l'instrument
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Ex: Violon, Piano, Guitare..."
                      required
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      {loading ? 'En cours...' : (editingInstrument ? 'Mettre à jour' : 'Créer')}
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
        {deleteConfirmation.isOpen && deleteConfirmation.instrument && (
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
                    Êtes-vous sûr de vouloir supprimer l'instrument{' '}
                    <span className="font-semibold text-dark">
                      {deleteConfirmation.instrument.name}
                    </span>{' '}
                    ?
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ Cet instrument sera retiré de tous les utilisateurs qui l'avaient assigné.
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

        {/* Liste des instruments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-poppins font-semibold text-lg text-dark">
                Liste des instruments
              </h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher un instrument..."
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
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement...</p>
            </div>
          ) : filteredInstruments.length === 0 && searchTerm ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>Aucun instrument trouvé pour "{searchTerm}"</p>
              <button onClick={() => setSearchTerm('')} className="text-primary hover:text-primary/80 mt-2">Effacer la recherche</button>
            </div>
          ) : instruments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Music className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>Aucun instrument trouvé</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredInstruments.map((instrument) => (
                <div key={instrument.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Music className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-dark text-lg">
                          {instrument.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Créé le {new Date(instrument.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(instrument)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        title="Modifier"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => confirmDelete(instrument)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Supprimer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminInstruments;