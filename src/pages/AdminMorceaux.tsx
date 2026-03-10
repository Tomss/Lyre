import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, Music, Search, X, CheckCircle, ArrowLeft, Users, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

import { API_URL } from '../config';

interface Morceau {
  id: string;
  nom: string;
  compositeur: string | null;
  arrangement: string | null;
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
  const { currentUser, token, isAuthenticated } = useAuth();
  const [morceaux, setMorceaux] = useState<Morceau[]>([]);
  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [orchestraFilter, setOrchestraFilter] = useState<string[]>([]);
  const [expandedOrchestras, setExpandedOrchestras] = useState<Set<string>>(new Set());
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

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const fetchMorceaux = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/morceaux`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Erreur de chargement des morceaux');
      const data = await response.json();
      setMorceaux(data || []);
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
    if (isAuthenticated && (currentUser?.role === 'Admin' || currentUser?.role === 'Gestionnaire')) {
      fetchMorceaux();
      fetchOrchestras();
    }
  }, [isAuthenticated, currentUser, token]);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);

    const url = editingMorceau ? `${API_URL}/morceaux/${editingMorceau.id}` : `${API_URL}/morceaux`;
    const method = editingMorceau ? 'PUT' : 'POST';

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
      fetchMorceaux();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirmation.morceau || !token) return;
    try {
      const response = await fetch(`${API_URL}/morceaux/${deleteConfirmation.morceau.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur de suppression');
      }
      const result = await response.json();
      showNotification(result.message);
      fetchMorceaux();
      setDeleteConfirmation({ isOpen: false, morceau: null });
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const confirmDelete = (morceau: Morceau) => {
    setDeleteConfirmation({ isOpen: true, morceau });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, morceau: null });
  };

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
    setFormData({ nom: '', compositeur: '', arrangement: '', orchestra_ids: [] });
  };

  const filteredMorceaux = morceaux.filter(morceau => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      morceau.nom.toLowerCase().includes(searchLower) ||
      (morceau.compositeur && morceau.compositeur.toLowerCase().includes(searchLower)) ||
      morceau.orchestras.some(o => o.name.toLowerCase().includes(searchLower))
    );

    const matchesOrchestra = orchestraFilter.length === 0 || morceau.orchestras.some(o => orchestraFilter.includes(o.id));

    return matchesSearch && matchesOrchestra;
  });

  const morceauxByOrchestra = filteredMorceaux.reduce((acc, morceau) => {
    morceau.orchestras.forEach(orchestra => {
      if (!acc[orchestra.id]) {
        acc[orchestra.id] = {
          orchestra,
          morceaux: [],
        };
      }
      acc[orchestra.id].morceaux.push(morceau);
    });
    return acc;
  }, {} as Record<string, { orchestra: Orchestra; morceaux: Morceau[] }>);

  const sortedOrchestras = Object.values(morceauxByOrchestra).sort((a, b) => a.orchestra.name.localeCompare(b.orchestra.name));

  sortedOrchestras.forEach(({ morceaux }) => {
    morceaux.sort((a, b) => a.nom.localeCompare(b.nom));
  });

  const toggleOrchestraFilter = (orchestraId: string) => {
    setOrchestraFilter(prev =>
      prev.includes(orchestraId)
        ? prev.filter(id => id !== orchestraId)
        : [...prev, orchestraId]
    );
  };

  const toggleOrchestraExpansion = (orchestraId: string) => {
    setExpandedOrchestras(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orchestraId)) {
        newSet.delete(orchestraId);
      } else {
        newSet.add(orchestraId);
      }
      return newSet;
    });
  };

  const expandAllOrchestras = () => {
    setExpandedOrchestras(new Set(orchestras.map(o => o.id)));
  };

  const collapseAllOrchestras = () => {
    setExpandedOrchestras(new Set());
  };

  if (isAuthenticated && !['Admin', 'Gestionnaire'].includes(currentUser?.role || '')) {
    return <Navigate to="/dashboard" />;
  }

  const getOrchestraColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
    ];
    return colors[index % colors.length];
  };

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
              Gestion des Morceaux
            </h1>
            <button onClick={() => { setEditingMorceau(null); setShowAddForm(true); }} className="flex items-center px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
              <Plus className="mr-2 h-5 w-5" />
              Ajouter un morceau
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Filtrer par orchestre:</span>
            <button onClick={() => setOrchestraFilter([])} className={`px-3 py-1 rounded-full text-sm ${orchestraFilter.length === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Tous</button>
            {orchestras.map(orchestra => (
              <button key={orchestra.id} onClick={() => toggleOrchestraFilter(orchestra.id)} className={`px-3 py-1 rounded-full text-sm ${orchestraFilter.includes(orchestra.id) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                {orchestra.name}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={expandAllOrchestras} className="text-sm bg-gray-200 px-3 py-1 rounded-md">Tout déplier</button>
            <button onClick={collapseAllOrchestras} className="text-sm bg-gray-200 px-3 py-1 rounded-md">Tout replier</button>
          </div>
        </div>

        {/* Morceaux List */}
        {loading ? (
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Chargement des morceaux...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedOrchestras
              .filter(({ orchestra }) => orchestraFilter.length === 0 || orchestraFilter.includes(orchestra.id))
              .map(({ orchestra, morceaux: orchestraMorceaux }, index) => (
                <div key={orchestra.id} className="bg-white rounded-xl shadow-lg border border-gray-200/80 overflow-hidden">
                  <div onClick={() => toggleOrchestraExpansion(orchestra.id)} className={`p-5 flex justify-between items-center cursor-pointer border-b border-gray-200/80 transition-colors ${getOrchestraColor(index).replace('text-', 'bg-').replace('-800', '-200')} hover:bg-gray-100/50`}>
                    <div className="flex items-center">
                      <Users size={28} className={`mr-4 ${getOrchestraColor(index).replace('bg-', 'text-').replace('-100', '-600')}`} />
                      <div>
                        <h2 className={`text-2xl font-bold ${getOrchestraColor(index).replace('bg-', 'text-').replace('-100', '-800')}`}>{orchestra.name} <span className="text-lg font-normal">({orchestraMorceaux.length})</span></h2>
                      </div>
                    </div>
                    <ChevronRight className={`transform transition-transform duration-300 ${expandedOrchestras.has(orchestra.id) ? 'rotate-90' : ''}`} />
                  </div>
                  {expandedOrchestras.has(orchestra.id) && (
                    <div className="divide-y divide-gray-200/80">
                      {orchestraMorceaux.map(morceau => (
                        <div key={morceau.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-gray-50/50 transition-colors duration-200">
                          <div className="flex-1 mb-4 md:mb-0">
                            <p className="font-bold text-lg text-gray-800">{morceau.nom}</p>
                            <p className="text-sm text-gray-500">{morceau.compositeur}{morceau.arrangement && ` - Arr. ${morceau.arrangement}`}</p>
                          </div>
                          <div className="flex items-center space-x-3 flex-shrink-0">
                            <button onClick={() => handleEdit(morceau)} className="p-2 text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors duration-200"><Edit size={18} /></button>
                            <button onClick={() => confirmDelete(morceau)} className="p-2 text-red-600 bg-red-100 hover:bg-red-200 rounded-full transition-colors duration-200"><Trash2 size={18} /></button>
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
                <h2 className="text-2xl font-bold text-gray-800">{editingMorceau ? 'Modifier' : 'Ajouter'} un morceau</h2>
                <button onClick={cancelEdit} className="p-2 rounded-full hover:bg-gray-200"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
                <input type="text" name="nom" value={formData.nom} onChange={handleInputChange} placeholder="Nom du morceau" required className="w-full px-4 py-2 border rounded-lg" />
                <input type="text" name="compositeur" value={formData.compositeur} onChange={handleInputChange} placeholder="Compositeur" className="w-full px-4 py-2 border rounded-lg" />
                <input type="text" name="arrangement" value={formData.arrangement} onChange={handleInputChange} placeholder="Arrangement" className="w-full px-4 py-2 border rounded-lg" />
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
                    {loading ? 'Enregistrement...' : (editingMorceau ? 'Mettre à jour' : 'Créer')}
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
              <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer le morceau <span className="font-bold">{deleteConfirmation.morceau?.nom}</span> ?</p>
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

export default AdminMorceaux;