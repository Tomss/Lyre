import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, FileText, Search, X, ArrowLeft, Download, Music2, ChevronRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

import { API_URL } from '../config';
import { PdfSplitterModal } from '../components/PdfSplitterModal';

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
  const [showSplitterModal, setShowSplitterModal] = useState(false);
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

  const sortedMorceauxGroups = Object.values(partitionsByMorceau).sort((a, b) => 
    a.morceau.nom.localeCompare(b.morceau.nom, 'fr', { numeric: true })
  );


  const getMorceauColor = (index: number) => {
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

  if (currentUser && !['Admin', 'Gestionnaire'].includes(currentUser.role)) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="font-inter pt-8 lg:pt-12 pb-20 min-h-screen bg-gray-100">
      <div className="w-full px-4 sm:px-10 lg:px-16">

        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="text-slate-400 hover:text-indigo-600 transition flex items-center mb-2 group">
            <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Retour au tableau de bord
          </Link>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Partitions</h1>
            <p className="text-slate-500 font-medium">Gérez simplement toutes vos partitions.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
               onClick={() => setShowSplitterModal(true)}
               className="flex justify-center items-center bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 font-bold hover:shadow-xl hover:-translate-y-0.5 duration-300 w-full sm:w-auto text-sm sm:text-base"
            >
              <Plus size={20} className="mr-2" />
              Ajouter un bloc
            </button>
            <button
               onClick={() => {
                 setEditingPartition(null);
                 setFormData({ nom: '', morceau_id: '', instrument_id: '' });
                 setSelectedFile(null);
                 setFilePreview(null);
                 setShowAddForm(true);
               }}
               className="flex justify-center items-center bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 font-bold hover:shadow-xl hover:-translate-y-0.5 duration-300 w-full sm:w-auto"
            >
              <Plus size={20} className="mr-2" />
              Ajouter une partition
            </button>
          </div>
        </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          {/* Row 1: Search Bar */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Rechercher</label>
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, morceau..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          {/* Row 2: Filters */}
          <div className="flex flex-col lg:flex-row gap-6 pt-2 border-t border-slate-100">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center">
                <Music2 className="w-4 h-4 mr-2 text-indigo-500" /> Filtrer par orchestre
              </label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setOrchestraFilter([])} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${orchestraFilter.length === 0 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tous</button>
                {orchestras.map(o => (
                  <button key={o.id} onClick={() => toggleOrchestraFilter(o.id)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${orchestraFilter.includes(o.id) ? 'bg-indigo-500 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {o.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:border-l lg:pl-6 border-slate-100 flex-1 border-t lg:border-t-0 pt-4 lg:pt-0">
              <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-amber-500" /> Filtrer par instrument
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                <button onClick={() => setInstrumentFilter([])} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${instrumentFilter.length === 0 ? 'bg-amber-600 text-white shadow-md shadow-amber-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tous</button>
                {instruments.map(i => (
                  <button key={i.id} onClick={() => toggleInstrumentFilter(i.id)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${instrumentFilter.includes(i.id) ? 'bg-amber-500 text-white shadow-md shadow-amber-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {i.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:border-l lg:pl-6 border-slate-100 flex flex-col justify-start gap-2 border-t lg:border-t-0 pt-4 lg:pt-0 min-w-[200px]">
              <button onClick={clearAllFilters} className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors w-full text-left md:text-center block mb-2">Réinitialiser les filtres</button>
              <div className="flex items-center space-x-2">
                <button onClick={expandAllMorceaux} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-200 transition text-sm font-medium whitespace-nowrap w-full">Tout déplier</button>
                <button onClick={collapseAllMorceaux} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-200 transition text-sm font-medium whitespace-nowrap w-full">Tout replier</button>
              </div>
            </div>
          </div>
        </div>

        {/* Partition List */}
        {loading ? (
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Chargement des partitions...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedMorceauxGroups.map(({ morceau, partitions: morceausPartitions }, index) => {
              const color = getMorceauColor(index);
              
              const sortedPartitions = [...morceausPartitions].sort((a, b) => {
                const nameA = a.instruments?.name || a.nom || '';
                const nameB = b.instruments?.name || b.nom || '';
                return nameA.localeCompare(nameB, 'fr', { numeric: true });
              });

              return (
              <div key={morceau.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div onClick={() => toggleMorceauExpansion(morceau.id)} className={`p-5 flex justify-between items-center cursor-pointer ${color.bg} hover:brightness-95 transition-all`}>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mr-4">
                      <Music2 size={24} className={color.icon} />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${color.text}`}>{morceau.nom}
                        <span className="ml-2 px-2.5 py-0.5 rounded-full bg-white/60 text-sm font-semibold text-slate-700">{morceausPartitions.length} partition{morceausPartitions.length > 1 ? 's' : ''}</span>
                      </h2>
                      <p className={`text-sm mt-1 opacity-80 ${color.text}`}>{morceau.compositeur || 'Compositeur inconnu'}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <ChevronRight className={`transform transition-transform duration-300 text-slate-500 ${expandedMorceaux.has(morceau.id) ? 'rotate-90' : ''}`} />
                  </div>
                </div>
                {expandedMorceaux.has(morceau.id) && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-slate-100 bg-slate-50/30">
                    {sortedPartitions.map(partition => (
                      <div key={partition.id} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-indigo-100 hover:shadow-md transition-all">
                        <div className="flex items-start space-x-3 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                            <FileText size={20} className="text-slate-400" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-tight mb-1">{partition.nom}</p>
                            <p className="text-sm font-medium text-indigo-600">{partition.instruments.name}</p>
                            {partition.file_name && <p className="text-xs text-slate-400 mt-1 truncate max-w-[150px]" title={partition.file_name}>{partition.file_name} - {((partition.file_size || 0) / 1024).toFixed(1)} KB</p>}
                          </div>
                        </div>
                        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-50">
                          {partition.file_path && <a href={partition.file_path} target="_blank" rel="noreferrer" title="Télécharger" className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all duration-300 hover:scale-110"><Download size={16} /></a>}
                          <button onClick={() => handleEdit(partition)} title="Modifier" className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all duration-300 hover:scale-110"><Edit size={16} /></button>
                          <button onClick={() => confirmDelete(partition)} title="Supprimer" className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all duration-300 hover:scale-110"><Trash2 size={16} /></button>
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex justify-center items-start p-4 pt-24">
            <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border border-white max-h-[calc(100vh-120px)] animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center p-5 bg-white border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                        {editingPartition ? <Edit size={20} /> : <Plus size={20} />}
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                        {editingPartition ? 'Modifier la partition' : 'Nouvelle partition'}
                    </h2>
                </div>
                <button onClick={cancelEdit} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                </button>
              </div>

              <form onSubmit={editingPartition ? handleUpdate : handleCreate} className="flex-grow overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-slate-50 to-white">
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                        <FileText className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Informations de la partition</h3>
                    </div>
                    
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div>
                            <label className="flex items-center text-sm font-semibold text-slate-700 mb-1">
                                Nom de la partition *
                            </label>
                            <input type="text" name="nom" value={formData.nom} onChange={handleInputChange} placeholder="Ex: Clarinette 1, Tutti..." required className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white text-sm" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center text-sm font-semibold text-slate-700 mb-1">
                                    Morceau associé *
                                </label>
                                <div className="relative">
                                    <select name="morceau_id" value={formData.morceau_id} onChange={handleInputChange} required className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white appearance-none text-sm">
                                      <option value="">Sélectionner un morceau</option>
                                      {morceaux.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                                    </select>
                                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={14} />
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center text-sm font-semibold text-slate-700 mb-1">
                                    Instrument ciblé *
                                </label>
                                <div className="relative">
                                    <select name="instrument_id" value={formData.instrument_id} onChange={handleInputChange} required className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white appearance-none text-sm">
                                      <option value="">Sélectionner un instrument</option>
                                      {instruments.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                    </select>
                                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={14} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                        <Download className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Fichier de partition</h3>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                      <div className="flex items-center space-x-4">
                        {filePreview && <img src={filePreview} alt="Aperçu" className="w-24 h-24 object-cover rounded-xl border shadow-sm" />}
                        <input type="file" accept=".pdf,image/*" onChange={handleFileChange} className="hidden" id="file-upload" />
                        <label htmlFor="file-upload" className="cursor-pointer bg-indigo-50 text-indigo-700 font-medium px-4 py-2.5 rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100">Parcourir...</label>
                        {(filePreview || selectedFile) && <button type="button" onClick={removeFile} title="Supprimer le fichier" className="p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"><Trash2 size={20} /></button>}
                      </div>
                      {selectedFile && <p className="text-sm text-slate-500 font-medium mt-2 flex items-center"><CheckCircle className="w-4 h-4 text-emerald-500 mr-1" /> {selectedFile.name}</p>}
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
                    ) : (editingPartition ? 'Mettre à jour' : 'Ajouter la partition')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <PdfSplitterModal
          isOpen={showSplitterModal}
          onClose={() => setShowSplitterModal(false)}
          morceaux={morceaux}
          instruments={instruments}
          onSuccess={() => {
            showNotification('Partitions générées avec succès !');
            fetchPartitions();
          }}
          token={token}
        />

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 m-4 max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmer la suppression</h3>
              <p className="text-slate-500 mb-6 text-sm">Êtes-vous sûr de vouloir supprimer la partition <span className="font-bold text-slate-700">{deleteConfirmation.partition?.nom}</span> ? Cette action est irréversible.</p>
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

export default AdminPartitions;
