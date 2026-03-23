import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, Music, X, ArrowLeft, Users, ChevronRight, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

import { API_URL } from '../config';

interface Morceau {
  id: string;
  nom: string;
  compositeur: string | null;
  arrangement: string | null;
  created_at: string;
  partitions_count?: number;
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
  const [orchestraFilter, setOrchestraFilter] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  const clearAllFilters = () => {
    setOrchestraFilter([]);
    setSearchTerm('');
  };

  const filteredMorceaux = morceaux.filter(morceau => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      morceau.nom.toLowerCase().includes(searchLower) ||
      (morceau.compositeur && morceau.compositeur.toLowerCase().includes(searchLower)) ||
      (morceau.arrangement && morceau.arrangement.toLowerCase().includes(searchLower)) ||
      morceau.orchestras.some(o => o.name.toLowerCase().includes(searchLower))
    );
    const matchesOrchestra = orchestraFilter.length === 0 || morceau.orchestras.some(o => orchestraFilter.includes(o.id));

    return matchesOrchestra && matchesSearch;
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
      { bg: 'bg-indigo-50', text: 'text-indigo-800', icon: 'text-indigo-600', border: 'border-l-indigo-500' },
      { bg: 'bg-emerald-50', text: 'text-emerald-800', icon: 'text-emerald-600', border: 'border-l-emerald-500' },
      { bg: 'bg-amber-50', text: 'text-amber-800', icon: 'text-amber-600', border: 'border-l-amber-500' },
      { bg: 'bg-rose-50', text: 'text-rose-800', icon: 'text-rose-600', border: 'border-l-rose-500' },
      { bg: 'bg-sky-50', text: 'text-sky-800', icon: 'text-sky-600', border: 'border-l-sky-500' },
      { bg: 'bg-purple-50', text: 'text-purple-800', icon: 'text-purple-600', border: 'border-l-purple-500' },
    ];
    return colors[index % colors.length];
  };

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
        <div className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          {/* Row 1: Search Bar */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Rechercher</label>
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, compositeur, orchestre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 pt-2 border-t border-slate-100">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2 text-indigo-500" /> Filtrer par orchestre
              </label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setOrchestraFilter([])} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${orchestraFilter.length === 0 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tous</button>
                {orchestras.map(orchestra => (
                  <button key={orchestra.id} onClick={() => toggleOrchestraFilter(orchestra.id)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${orchestraFilter.includes(orchestra.id) ? 'bg-indigo-500 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {orchestra.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="lg:border-l lg:pl-6 border-slate-100 flex flex-col justify-start gap-2 border-t lg:border-t-0 pt-4 lg:pt-0 min-w-[200px]">
              <button onClick={clearAllFilters} className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors w-full text-left md:text-center block mb-2">Réinitialiser les filtres</button>
              <div className="flex items-center space-x-2">
                <button onClick={expandAllOrchestras} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-200 transition text-sm font-medium whitespace-nowrap w-full">Tout déplier</button>
                <button onClick={collapseAllOrchestras} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-200 transition text-sm font-medium whitespace-nowrap w-full">Tout replier</button>
              </div>
            </div>
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
              .map(({ orchestra, morceaux: orchestraMorceaux }, index) => {
                const color = getOrchestraColor(index);
                return (
                <div key={orchestra.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div onClick={() => toggleOrchestraExpansion(orchestra.id)} className={`p-5 flex justify-between items-center cursor-pointer border-l-4 ${color.border} ${color.bg} hover:brightness-95 transition-all`}>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mr-4">
                        <Users size={24} className={color.icon} />
                      </div>
                      <div>
                        <h2 className={`text-xl font-bold ${color.text}`}>{orchestra.name} 
                          <span className="ml-2 px-2.5 py-0.5 rounded-full bg-white/60 text-sm font-semibold">{orchestraMorceaux.length} morceau{orchestraMorceaux.length > 1 ? 'x' : ''}</span>
                        </h2>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                      <ChevronRight className={`transform transition-transform duration-300 text-slate-500 ${expandedOrchestras.has(orchestra.id) ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                  {expandedOrchestras.has(orchestra.id) && (
                    <div className="divide-y divide-slate-100">
                      {orchestraMorceaux.map(morceau => (
                        <div key={morceau.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-slate-50/80 transition-colors duration-200">
                          <div className="flex-1 mb-4 md:mb-0">
                            <p className="font-semibold text-slate-800">{morceau.nom}</p>
                            <p className="text-sm text-slate-500 flex items-center mt-1">
                              <Music className="w-3 h-3 mr-1.5 opacity-50" />
                              {morceau.compositeur || 'Compositeur inconnu'}
                              {morceau.arrangement && <span className="ml-2 text-slate-400">• Arr. {morceau.arrangement}</span>}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <button onClick={() => handleEdit(morceau)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all duration-300 hover:scale-110 shadow-sm" title="Modifier"><Edit size={16} /></button>
                            <button onClick={() => confirmDelete(morceau)} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all duration-300 hover:scale-110 shadow-sm" title="Supprimer"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )})}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 flex justify-center items-start p-4 pt-24">
            <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border border-white max-h-[calc(100vh-120px)] animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center p-5 bg-white border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                        {editingMorceau ? <Edit size={20} /> : <Plus size={20} />}
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                        {editingMorceau ? 'Modifier le morceau' : 'Nouveau morceau'}
                    </h2>
                </div>
                <button onClick={cancelEdit} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-slate-50 to-white">
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                        <Music className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Informations du morceau</h3>
                    </div>
                    
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div>
                            <label className="flex items-center text-sm font-semibold text-slate-700 mb-1">
                                Nom du morceau *
                            </label>
                            <input type="text" name="nom" value={formData.nom} onChange={handleInputChange} placeholder="Ex: Jupiter" required className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white text-sm" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center text-sm font-semibold text-slate-700 mb-1">
                                    Compositeur (Optionnel)
                                </label>
                                <input type="text" name="compositeur" value={formData.compositeur} onChange={handleInputChange} placeholder="Ex: Gustav Holst" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white text-sm" />
                            </div>
                            <div>
                                <label className="flex items-center text-sm font-semibold text-slate-700 mb-1">
                                    Arrangement (Optionnel)
                                </label>
                                <input type="text" name="arrangement" value={formData.arrangement} onChange={handleInputChange} placeholder="Ex: A. Waignein" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white text-sm" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                        <Users className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Orchestres Associés</h3>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50/50 rounded-xl border border-slate-100 shadow-inner">
                            {orchestras.map(orchestra => (
                                <label key={orchestra.id} className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm cursor-pointer group hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                                    <input type="checkbox" checked={formData.orchestra_ids.includes(orchestra.id)} onChange={e => handleOrchestraChange(orchestra.id, e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600" />
                                    <span className="text-xs font-medium text-slate-600 group-hover:text-indigo-700">{orchestra.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end pt-2 gap-3">
                  <button type="button" onClick={cancelEdit} className="px-5 py-2.5 text-slate-500 hover:text-slate-700 font-bold transition hover:bg-slate-50 rounded-xl text-sm">Annuler</button>
                  <button type="submit" disabled={loading} className="px-8 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold transition shadow-lg shadow-indigo-200 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? (
                      <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                          Validation...
                      </>
                    ) : (editingMorceau ? 'Mettre à jour' : 'Ajouter le morceau')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 m-4 max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmer la suppression</h3>
              <p className="text-slate-500 mb-6 text-sm">Êtes-vous sûr de vouloir supprimer le morceau <span className="font-bold text-slate-700">{deleteConfirmation.morceau?.nom}</span> ? Cette action est irréversible.</p>
              
              {deleteConfirmation.morceau?.partitions_count && deleteConfirmation.morceau.partitions_count > 0 ? (
                <div className="bg-amber-50 text-amber-700 p-3 rounded-xl text-sm mb-6 border border-amber-200 text-left">
                  <strong className="block mb-1">Attention !</strong>
                  Ce morceau possède <span className="font-bold">{deleteConfirmation.morceau.partitions_count} partition(s)</span> associée(s). 
                  La suppression de ce morceau entraînera la <strong className="font-bold">suppression définitive</strong> de toutes ses partitions.
                </div>
              ) : null}

              <div className="flex justify-center space-x-3">
                <button onClick={cancelDelete} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">Annuler</button>
                <button onClick={handleDelete} className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-red-200 hover:bg-red-700 transition-colors">Supprimer</button>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification.show && (
          <div className={`fixed top-5 right-5 p-4 rounded-xl shadow-2xl text-white z-[100] transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            <div className="flex items-center space-x-3 text-sm font-semibold">
              <span>{notification.message}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminMorceaux;