import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, FileText, Search, X, CheckCircle, ArrowLeft, Upload, Music, Download, Users, Music2, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

import { API_URL } from '../config';

interface Partition {
  id: string;
  nom: string;
  morceau_id: string;
  instrument_id: string;
  file_path: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
  morceaux: {
    id: string;
    nom: string;
    compositeur: string | null;
    arrangement: string | null;
    orchestras?: Orchestra[];
  };
  instruments: {
    id: string;
    name: string;
  };
}

interface Morceau {
  id: string;
  nom: string;
  compositeur: string | null;
  arrangement: string | null;
}

interface Instrument {
  id: string;
  name: string;
}

interface Orchestra {
  id: string;
  name: string;
}

interface DeleteConfirmation {
  isOpen: boolean;
  partition: Partition | null;
}

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

const AdminPartitions = () => {
  const { currentUser, token, isAuthenticated } = useAuth();
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [morceaux, setMorceaux] = useState<Morceau[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [orchestraFilter, setOrchestraFilter] = useState<string[]>([]);
  const [instrumentFilter, setInstrumentFilter] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedMorceaux, setExpandedMorceaux] = useState<Set<string>>(new Set());
  const [editingPartition, setEditingPartition] = useState<Partition | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    isOpen: false,
    partition: null,
  });
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'success',
  });
  const [formData, setFormData] = useState({
    nom: '',
    morceau_id: '',
    instrument_id: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);


  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // MIGRÉ
  const fetchPartitions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/partitions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.status === 403) throw new Error('Accès refusé.');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setPartitions(data || []);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des partitions:', err);
      showNotification(err.message, 'error');
    }
    setLoading(false);
  };

  // MIGRÉ
  const fetchMorceaux = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/morceaux`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.status === 403) throw new Error('Accès refusé.');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setMorceaux(data || []);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des morceaux:', err);
      showNotification(err.message, 'error');
    }
  };

  // MIGRÉ
  const fetchInstruments = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/instruments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.status === 403) throw new Error('Accès refusé.');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setInstruments(data || []);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des instruments:', err);
      showNotification(err.message, 'error');
    }
  };

  // MIGRÉ
  const fetchOrchestras = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/orchestras`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.status === 403) throw new Error('Accès refusé.');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setOrchestras(data || []);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des orchestres:', err);
      showNotification(err.message, 'error');
    }
  };

  useEffect(() => {
    const userRole = currentUser?.role;
    if (isAuthenticated && (userRole === 'Admin' || userRole === 'Gestionnaire')) {
      fetchPartitions();
      fetchMorceaux();
      fetchInstruments();
      fetchOrchestras();
    }
  }, [isAuthenticated, currentUser, token]);

  // ... Le reste du composant reste inchangé pour l'instant

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Vérifier le type de fichier
      if (!file.type.includes('pdf') && !file.type.startsWith('image/')) {
        showNotification('Seuls les fichiers PDF et images sont autorisés', 'error');
        return;
      }

      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showNotification('Le fichier ne doit pas dépasser 10MB', 'error');
        return;
      }

      setSelectedFile(file);

      // Créer une prévisualisation pour les images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);

    try {
      let filePayload = {};

      if (selectedFile) {
        const fileFormData = new FormData();
        fileFormData.append('file', selectedFile);

        const uploadResponse = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: fileFormData,
        });

        if (!uploadResponse.ok) throw new Error('Failed to upload file');
        const uploadResult = await uploadResponse.json();

        filePayload = {
          file_path: uploadResult.filePath,
          file_name: selectedFile.name,
          file_type: selectedFile.type.includes('pdf') ? 'pdf' : 'image',
          file_size: selectedFile.size,
        };
      }

      const response = await fetch(`${API_URL}/partitions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, ...filePayload }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur de création');
      }

      const result = await response.json();
      showNotification(result.message);
      cancelEdit();
      fetchPartitions();
    } catch (err: any) {
      console.error('Erreur de création:', err);
      showNotification(err.message, 'error');
    }
    setLoading(false);
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPartition || !token) return;
    setLoading(true);

    try {
      let filePayload = {
        file_path: editingPartition.file_path,
        file_name: editingPartition.file_name,
        file_type: editingPartition.file_type,
        file_size: editingPartition.file_size,
      };

      if (selectedFile) {
        const fileFormData = new FormData();
        fileFormData.append('file', selectedFile);

        const uploadResponse = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: fileFormData,
        });

        if (!uploadResponse.ok) throw new Error('Failed to upload file');
        const uploadResult = await uploadResponse.json();

        filePayload = {
          ...filePayload,
          file_path: uploadResult.filePath,
          file_name: selectedFile.name,
          file_type: selectedFile.type.includes('pdf') ? 'pdf' : 'image',
          file_size: selectedFile.size,
        };
      }

      const response = await fetch(`${API_URL}/partitions/${editingPartition.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, ...filePayload }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur de mise à jour');
      }

      const result = await response.json();
      showNotification(result.message);
      cancelEdit();
      fetchPartitions();
    } catch (err: any) {
      console.error('Erreur de mise à jour:', err);
      showNotification(err.message, 'error');
    }
    setLoading(false);
  };

  // Supprimer une partition
  const confirmDelete = (partition: Partition) => {
    setDeleteConfirmation({
      isOpen: true,
      partition: partition,
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirmation.partition || !token) return;

    try {
      const response = await fetch(`${API_URL}/partitions/${deleteConfirmation.partition.id}`, {
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
      fetchPartitions(); // Re-fetch the list
      setDeleteConfirmation({ isOpen: false, partition: null });
    } catch (err: any) {
      console.error('Erreur de suppression:', err);
      showNotification(err.message, 'error');
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, partition: null });
  };

  // Préparer l\'édition
  const handleEdit = (partition: Partition) => {
    setEditingPartition(partition);
    setFormData({
      nom: partition.nom,
      morceau_id: partition.morceau_id,
      instrument_id: partition.instrument_id,
    });
    setSelectedFile(null);
    setFilePreview(partition.file_type === 'image' ? partition.file_path : null);
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingPartition(null);
    setShowAddForm(false);
    setFormData({
      nom: '',
      morceau_id: '',
      instrument_id: '',
    });
    setSelectedFile(null);
    setFilePreview(null);
  };

  // Fonctions de filtrage
  const toggleOrchestraFilter = (orchestraId: string) => {
    setOrchestraFilter(prev =>
      prev.includes(orchestraId)
        ? prev.filter(id => id !== orchestraId)
        : [...prev, orchestraId]
    );
  };


  const toggleInstrumentFilter = (instrumentId: string) => {
    setInstrumentFilter(prev =>
      prev.includes(instrumentId)
        ? prev.filter(id => id !== instrumentId)
        : [...prev, instrumentId]
    );
  };

  const clearAllFilters = () => {
    setOrchestraFilter([]);
    setInstrumentFilter([]);
    setSearchTerm('');
  };

  const toggleMorceauExpansion = (morceauId: string) => {
    setExpandedMorceaux(prev => {
      const newSet = new Set(prev);
      if (newSet.has(morceauId)) {
        newSet.delete(morceauId);
      } else {
        newSet.add(morceauId);
      }
      return newSet;
    });
  };

  const expandAllMorceaux = () => {
    const allMorceauIds = new Set(filteredPartitions.map(p => p.morceau_id));
    setExpandedMorceaux(allMorceauIds);
  };

  const collapseAllMorceaux = () => {
    setExpandedMorceaux(new Set());
  };

  // Filtrer les partitions
  const filteredPartitions = partitions.filter(partition => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      partition.nom.toLowerCase().includes(searchLower) ||
      partition.morceaux.nom.toLowerCase().includes(searchLower) ||
      (partition.morceaux.orchestras && partition.morceaux.orchestras.some(o => o.name.toLowerCase().includes(searchLower)))
    );

    // Filtrer par orchestre (via le morceau)
    const matchesOrchestra = orchestraFilter.length === 0 ||
      orchestraFilter.some(orchestraId =>
        partition.morceaux.orchestras?.some(o => o.id === orchestraId)
      );

    // Filtrer par instrument
    const matchesInstrument = instrumentFilter.length === 0 ||
      instrumentFilter.includes(partition.instrument_id);

    return matchesSearch && matchesOrchestra && matchesInstrument;
  });

  // Grouper les partitions par morceau
  const partitionsByMorceau = filteredPartitions.reduce((acc, partition) => {
    const morceauId = partition.morceau_id;
    if (!acc[morceauId]) {
      acc[morceauId] = {
        morceau: partition.morceaux,
        partitions: []
      };
    }
    acc[morceauId].partitions.push(partition);
    return acc;
  }, {} as Record<string, { morceau: any; partitions: Partition[] }>);

  const openFile = (partition: Partition) => {
    if (partition.file_path) {
      window.open(partition.file_path, '_blank');
    }
  };

  if (currentUser && !['Admin', 'Gestionnaire'].includes(currentUser.role)) {
    return <Navigate to="/dashboard" />;
  }

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
              <FileText className="mr-3 h-8 w-8 text-indigo-600" />
              Gestion des Partitions
            </h1>
            <button onClick={() => { setEditingPartition(null); setShowAddForm(true); }} className="flex items-center px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
              <Plus className="mr-2 h-5 w-5" />
              Ajouter une partition
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, morceau..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <button onClick={clearAllFilters} className="text-sm text-blue-600 hover:underline mt-7">Réinitialiser les filtres</button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par orchestre</label>
              <div className="flex flex-wrap gap-2">
                {orchestras.map(o => (
                  <button key={o.id} onClick={() => toggleOrchestraFilter(o.id)} className={`px-2 py-1 text-xs rounded-full ${orchestraFilter.includes(o.id) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{o.name}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par instrument</label>
              <div className="flex flex-wrap gap-2">
                {instruments.map(i => (
                  <button key={i.id} onClick={() => toggleInstrumentFilter(i.id)} className={`px-2 py-1 text-xs rounded-full ${instrumentFilter.includes(i.id) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{i.name}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <button onClick={expandAllMorceaux} className="text-sm bg-gray-200 px-3 py-1 rounded-md mr-2">Tout déplier</button>
          <button onClick={collapseAllMorceaux} className="text-sm bg-gray-200 px-3 py-1 rounded-md">Tout replier</button>
        </div>

        {/* Partition List */}
        {loading ? (
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Chargement des partitions...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.values(partitionsByMorceau).map(({ morceau, partitions: morceausPartitions }) => (
              <div key={morceau.id} className="bg-white rounded-xl shadow-lg border border-gray-200/80 overflow-hidden">
                <div onClick={() => toggleMorceauExpansion(morceau.id)} className="p-5 flex justify-between items-center cursor-pointer bg-gray-50/80 border-b border-gray-200/80 hover:bg-gray-100/50 transition-colors">
                  <div className="flex items-center">
                    <Music2 size={28} className="mr-4 text-blue-600" />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{morceau.nom}</h2>
                      <p className="text-sm text-gray-500">{morceau.compositeur}</p>
                    </div>
                  </div>
                  <ChevronRight className={`transform transition-transform duration-300 ${expandedMorceaux.has(morceau.id) ? 'rotate-90' : ''}`} />
                </div>
                {expandedMorceaux.has(morceau.id) && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {morceausPartitions.map(partition => (
                      <div key={partition.id} className="p-4 bg-gray-50/50 rounded-lg border border-gray-200/80 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText size={24} className="text-gray-500" />
                          <div>
                            <p className="font-semibold text-lg">{partition.nom} <span className="font-normal text-gray-600">({partition.instruments.name})</span></p>
                            {partition.file_name && <p className="text-xs text-gray-500">{partition.file_name} - {(partition.file_size / 1024).toFixed(2)} KB</p>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {partition.file_path && <a href={partition.file_path} target="_blank" rel="noreferrer" className="p-2 text-green-600 bg-green-100 hover:bg-green-200 rounded-full"><Download size={18} /></a>}
                          <button onClick={() => handleEdit(partition)} className="p-2 text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-full"><Edit size={18} /></button>
                          <button onClick={() => confirmDelete(partition)} className="p-2 text-red-600 bg-red-100 hover:bg-red-200 rounded-full"><Trash2 size={18} /></button>
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
                <h2 className="text-2xl font-bold text-gray-800">{editingPartition ? 'Modifier' : 'Ajouter'} une partition</h2>
                <button onClick={cancelEdit} className="p-2 rounded-full hover:bg-gray-200"><X size={24} /></button>
              </div>
              <form onSubmit={editingPartition ? handleUpdate : handleCreate} className="flex-grow overflow-y-auto p-6 space-y-4">
                <input type="text" name="nom" value={formData.nom} onChange={handleInputChange} placeholder="Nom de la partition (ex: Clarinette 1, Tutti...)" required className="w-full px-4 py-2 border rounded-lg" />
                <select name="morceau_id" value={formData.morceau_id} onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-lg bg-white">
                  <option value="">Sélectionner un morceau</option>
                  {morceaux.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                </select>
                <select name="instrument_id" value={formData.instrument_id} onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-lg bg-white">
                  <option value="">Sélectionner un instrument</option>
                  {instruments.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fichier (PDF ou image)</label>
                  <div className="flex items-center space-x-4">
                    {filePreview && <img src={filePreview} alt="Aperçu" className="w-24 h-24 object-cover rounded-lg" />}
                    <input type="file" accept=".pdf,image/*" onChange={handleFileChange} className="hidden" id="file-upload" />
                    <label htmlFor="file-upload" className="cursor-pointer bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">Choisir un fichier</label>
                    {(filePreview || selectedFile) && <button type="button" onClick={removeFile} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 /></button>}
                  </div>
                  {selectedFile && <p className="text-sm text-gray-500 mt-2">Fichier sélectionné: {selectedFile.name}</p>}
                </div>
                <div className="flex justify-end pt-4 border-t">
                  <button type="button" onClick={cancelEdit} className="mr-4 px-6 py-2 rounded-lg border hover:bg-gray-100">Annuler</button>
                  <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:bg-blue-300">
                    {loading ? 'Enregistrement...' : (editingPartition ? 'Mettre à jour' : 'Créer')}
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
              <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer la partition <span className="font-bold">{deleteConfirmation.partition?.nom}</span> ?</p>
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

export default AdminPartitions;
