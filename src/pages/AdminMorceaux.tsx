import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, Music, Search, X, CheckCircle, ArrowLeft, Users, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

interface Morceau {
  id: string;
  nom: string;
  compositeur: string | null;
  arrangement: string | null;
  annees: string[];
  created_at: string;
  orchestras: Orchestra[];
}

interface Orchestra {
  id: string;
  name: string;
}

interface DeleteConfirmation {
  isOpen: boolean;
  morceau: Morceau | null;
}

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

const AdminMorceaux = () => {
  const { profile } = useAuth();
  const [morceaux, setMorceaux] = useState<Morceau[]>([]);
  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMorceau, setEditingMorceau] = useState<Morceau | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    isOpen: false,
    morceau: null,
  });
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'success',
  });
  const [formData, setFormData] = useState({
    nom: '',
    compositeur: '',
    arrangement: '',
    orchestra_ids: [] as string[],
  });

  // Fonction pour afficher une notification
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Récupérer tous les morceaux
  const fetchMorceaux = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-morceaux`, {
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
      setMorceaux(data || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des morceaux:', err);
      showNotification('Erreur lors du chargement des morceaux', 'error');
    }
    setLoading(false);
  };

  // Récupérer tous les orchestres
  const fetchOrchestras = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-orchestras`, {
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
      setOrchestras(data || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des orchestres:', err);
    }
  };

  useEffect(() => {
    if (profile?.role === 'Admin' || profile?.role === 'Gestionnaire') {
      fetchMorceaux();
      fetchOrchestras();
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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


  // Créer un morceau
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-morceaux`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      showNotification(result.message);
      cancelEdit();
      fetchMorceaux();
    } catch (err) {
      console.error('Erreur de création:', err);
      showNotification('Erreur de création: ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
    }
    setLoading(false);
  };

  // Mettre à jour un morceau
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingMorceau) return;
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-morceaux`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          id: editingMorceau.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      showNotification(result.message);
      cancelEdit();
      fetchMorceaux();
    } catch (err) {
      console.error('Erreur de mise à jour:', err);
      showNotification('Erreur de mise à jour: ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
    }
    setLoading(false);
  };

  // Supprimer un morceau
  const confirmDelete = (morceau: Morceau) => {
    setDeleteConfirmation({
      isOpen: true,
      morceau: morceau,
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirmation.morceau) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-morceaux`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          id: deleteConfirmation.morceau.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      showNotification(result.message);
      fetchMorceaux();
      setDeleteConfirmation({ isOpen: false, morceau: null });
    } catch (err) {
      console.error('Erreur de suppression:', err);
      showNotification('Erreur de suppression: ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, morceau: null });
  };

  // Préparer l'édition
  const handleEdit = (morceau: Morceau) => {
    setEditingMorceau(morceau);
    setFormData({
      nom: morceau.nom,
      compositeur: morceau.compositeur || '',
      arrangement: morceau.arrangement || '',
      orchestra_ids: morceau.orchestras?.map(o => o.id) || [],
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingMorceau(null);
    setShowAddForm(false);
    setFormData({
      nom: '',
      compositeur: '',
      arrangement: '',
      orchestra_ids: [],
    });
  };

  // Filtrer les morceaux
  const filteredMorceaux = morceaux.filter(morceau => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      morceau.nom.toLowerCase().includes(searchLower) ||
      (morceau.compositeur && morceau.compositeur.toLowerCase().includes(searchLower)) ||
           morceau.orchestras.some(o => o.name.toLowerCase().includes(searchLower));
      morceau.annees.some(a => a.includes(searchTerm))
    );
    
    return matchesSearch;
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
                <Music className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="font-poppins font-bold text-3xl text-dark">
                  Gestion des morceaux
                </h1>
                <p className="font-inter text-gray-600">
                  Gérez le répertoire musical de l'école
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span>Ajouter un morceau</span>
            </button>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-4">
            <span className="flex items-center space-x-1">
              <Music className="h-4 w-4" />
              <span>{filteredMorceaux.length} morceau{filteredMorceaux.length > 1 ? 'x' : ''} {searchTerm && `sur ${morceaux.length}`}</span>
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
                      {editingMorceau ? <Edit className="h-6 w-6 text-primary" /> : <Plus className="h-6 w-6 text-primary" />}
                    </div>
                    <h2 className="font-poppins font-semibold text-xl text-dark">
                      {editingMorceau ? 'Modifier le morceau' : 'Ajouter un morceau'}
                    </h2>
                  </div>
                  <button
                    onClick={cancelEdit}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={editingMorceau ? handleUpdate : handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Nom du morceau
                    </label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Ex: La Marseillaise, Hymne à la joie..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">
                        Compositeur (optionnel)
                      </label>
                      <input
                        type="text"
                        name="compositeur"
                        value={formData.compositeur}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Ex: Beethoven, Mozart..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">
                        Arrangement (optionnel)
                      </label>
                      <input
                        type="text"
                        name="arrangement"
                        value={formData.arrangement}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Ex: Version orchestre d'harmonie..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-3">
                      Orchestres concernés (au moins un requis)
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {orchestras.map((orchestra) => (
                        <label key={orchestra.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={formData.orchestra_ids.includes(orchestra.id)}
                            onChange={(e) => handleOrchestraChange(orchestra.id, e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-gray-700">{orchestra.name}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Sélectionnez au moins un orchestre
                    </p>
                  </div>


                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading || formData.orchestra_ids.length === 0}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      {loading ? 'En cours...' : (editingMorceau ? 'Mettre à jour' : 'Créer')}
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
        {deleteConfirmation.isOpen && deleteConfirmation.morceau && (
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
                    Êtes-vous sûr de vouloir supprimer le morceau{' '}
                    <span className="font-semibold text-dark">
                      {deleteConfirmation.morceau.nom}
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

        {/* Liste des morceaux */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-poppins font-semibold text-lg text-dark">
                Liste des morceaux
              </h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher un morceau..."
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
          ) : filteredMorceaux.length === 0 && searchTerm ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>Aucun morceau trouvé pour "{searchTerm}"</p>
              <button onClick={() => setSearchTerm('')} className="text-primary hover:text-primary/80 mt-2">Effacer la recherche</button>
            </div>
          ) : morceaux.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Music className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>Aucun morceau trouvé</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredMorceaux.map((morceau) => (
                <div key={morceau.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <Music className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-dark text-lg">
                            {morceau.nom}
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          {morceau.compositeur && (
                            <div>
                              <span className="font-medium">Compositeur :</span> {morceau.compositeur}
                            </div>
                          )}
                          {morceau.arrangement && (
                            <div>
                              <span className="font-medium">Arrangement :</span> {morceau.arrangement}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                          <span>
                            Ajouté le {new Date(morceau.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs">
                          {morceau.orchestras && morceau.orchestras.length > 0 && (
                            <div className="flex items-center space-x-1 text-gray-500">
                              <Users className="h-3 w-3" />
                              <span>{morceau.orchestras.map(o => o.name).join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(morceau)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        title="Modifier"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => confirmDelete(morceau)}
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

export default AdminMorceaux;