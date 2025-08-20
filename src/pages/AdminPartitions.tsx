import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, FileText, Search, X, CheckCircle, ArrowLeft, Upload, Music, Users, Download, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

interface Partition {
  id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_type: 'pdf' | 'image';
  file_size: number;
  mime_type: string;
  created_at: string;
  instrument?: {
    id: string;
    name: string;
  };
  morceaux: {
    id: string;
    nom: string;
    compositeur: string | null;
    arrangement: string | null;
    morceau_orchestras: Array<{
      orchestra_id: string;
      orchestras: {
        id: string;
        name: string;
      };
    }>;
  };
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface Morceau {
  id: string;
  nom: string;
  compositeur: string | null;
  arrangement: string | null;
  orchestras: Orchestra[];
}

interface Orchestra {
  id: string;
  name: string;
}

interface Instrument {
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
  const { profile } = useAuth();
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [morceaux, setMorceaux] = useState<Morceau[]>([]);
  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrchestras, setSelectedOrchestras] = useState<string[]>([]);
  const [selectedMorceaux, setSelectedMorceaux] = useState<string[]>([]);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
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
    title: '',
    morceau_id: '',
    instrument_id: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fonction pour afficher une notification
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Récupérer toutes les partitions
  const fetchPartitions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-partitions`, {
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
      setPartitions(data || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des partitions:', err);
      showNotification('Erreur lors du chargement des partitions', 'error');
    }
    setLoading(false);
  };

  // Récupérer tous les morceaux avec leurs orchestres
  const fetchMorceaux = async () => {
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
    }
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

  // Récupérer tous les instruments
  const fetchInstruments = async () => {
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
    }
  };

  useEffect(() => {
    if (profile?.role === 'Admin' || profile?.role === 'Gestionnaire') {
      fetchPartitions();
      fetchMorceaux();
      fetchOrchestras();
      fetchInstruments();
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Vérifier le type de fichier
      if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
        showNotification('Seuls les fichiers PDF et images sont autorisés', 'error');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  // Upload du fichier vers Supabase Storage
  const uploadFile = async (file: File): Promise<any> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `partition_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `partitions/${fileName}`;
      
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
        
      return {
        file_name: file.name,
        file_path: urlData.publicUrl,
        file_type: file.type === 'application/pdf' ? 'pdf' : 'image',
        file_size: file.size,
        mime_type: file.type
      };
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      showNotification('Erreur lors de l\'upload du fichier', 'error');
      throw error;
    }
  };

  // Créer une partition
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showNotification('Veuillez sélectionner un fichier', 'error');
      return;
    }
    setLoading(true);

    try {
      // Upload du fichier
      const uploadedFile = await uploadFile(selectedFile);

      // Trouver l'orchestre du morceau sélectionné
      const selectedMorceau = morceaux.find(m => m.id === formData.morceau_id);
      if (!selectedMorceau || selectedMorceau.orchestras.length === 0) {
        throw new Error("Morceau non trouvé ou sans orchestre associé");
      }

      const orchestra_id = selectedMorceau.orchestras[0].id; // Prendre le premier orchestre

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-partitions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          title: formData.title,
          morceau_id: formData.morceau_id,
          instrument_id: formData.instrument_id,
          orchestra_id: orchestra_id,
          file_name: uploadedFile.file_name,
          file_path: uploadedFile.file_path,
          file_type: uploadedFile.file_type,
          file_size: uploadedFile.file_size,
          mime_type: uploadedFile.mime_type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      showNotification(result.message);
      cancelEdit();
      fetchPartitions();
    } catch (err) {
      console.error('Erreur de création:', err);
      showNotification('Erreur de création: ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
    }
    setLoading(false);
  };

  // Mettre à jour une partition
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPartition) return;
    setLoading(true);

    try {
      let uploadedFile = null;
      if (selectedFile) {
        uploadedFile = await uploadFile(selectedFile);
      }

      // Trouver l'orchestre du morceau sélectionné
      const selectedMorceau = morceaux.find(m => m.id === formData.morceau_id);
      if (!selectedMorceau || selectedMorceau.orchestras.length === 0) {
        throw new Error("Morceau non trouvé ou sans orchestre associé");
      }

      const orchestra_id = selectedMorceau.orchestras[0].id; // Prendre le premier orchestre

      const requestBody: any = {
        action: 'update',
        id: editingPartition.id,
        title: formData.title,
        morceau_id: formData.morceau_id,
        instrument_id: formData.instrument_id,
        orchestra_id: orchestra_id,
      };

      if (uploadedFile) {
        requestBody.file_name = uploadedFile.file_name;
        requestBody.file_path = uploadedFile.file_path;
        requestBody.file_type = uploadedFile.file_type;
        requestBody.file_size = uploadedFile.file_size;
        requestBody.mime_type = uploadedFile.mime_type;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-partitions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      showNotification(result.message);
      cancelEdit();
      fetchPartitions();
    } catch (err) {
      console.error('Erreur de mise à jour:', err);
      showNotification('Erreur de mise à jour: ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
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
    if (!deleteConfirmation.partition) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-partitions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          id: deleteConfirmation.partition.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      showNotification(result.message);
      fetchPartitions();
      setDeleteConfirmation({ isOpen: false, partition: null });
    } catch (err) {
      console.error('Erreur de suppression:', err);
      showNotification('Erreur de suppression: ' + (err instanceof Error ? err.message : 'Erreur inconnue'), 'error');
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, partition: null });
  };

  // Préparer l'édition
  const handleEdit = (partition: Partition) => {
    setEditingPartition(partition);
    setFormData({
      title: partition.title,
      morceau_id: partition.morceaux.id,
      instrument_id: partition.instrument?.id || '',
    });
    setSelectedFile(null);
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingPartition(null);
    setShowAddForm(false);
    setFormData({
      title: '',
      morceau_id: '',
      instrument_id: '',
    });
    setSelectedFile(null);
  };

  // Logique de filtrage en cascade
  // 1. Morceaux filtrés par orchestres sélectionnés
  const filteredMorceaux = selectedOrchestras.length === 0 
    ? morceaux 
    : morceaux.filter(morceau => 
        morceau.orchestras.some(orchestra => selectedOrchestras.includes(orchestra.id))
      );

  // 2. Partitions filtrées par recherche, morceaux et instruments
  const filteredPartitions = partitions.filter(partition => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      partition.title.toLowerCase().includes(searchLower) ||
      partition.morceaux.nom.toLowerCase().includes(searchLower) ||
      (partition.instrument?.name && partition.instrument.name.toLowerCase().includes(searchLower)) ||
      (partition.morceaux.compositeur && partition.morceaux.compositeur.toLowerCase().includes(searchLower))
    );

    const matchesMorceau = selectedMorceaux.length === 0 || selectedMorceaux.includes(partition.morceaux.id);
    const matchesInstrument = selectedInstruments.length === 0 || (partition.instrument && selectedInstruments.includes(partition.instrument.id));

    // Vérifier si la partition appartient aux orchestres sélectionnés
    const matchesOrchestra = selectedOrchestras.length === 0 || 
      partition.morceaux.morceau_orchestras.some(mo => selectedOrchestras.includes(mo.orchestra_id));

    return matchesSearch && matchesMorceau && matchesInstrument && matchesOrchestra;
  });

  // Fonctions de gestion des filtres
  const toggleOrchestra = (orchestraId: string) => {
    setSelectedOrchestras(prev => 
      prev.includes(orchestraId) 
        ? prev.filter(id => id !== orchestraId)
        : [...prev, orchestraId]
    );
    // Reset des morceaux quand on change d'orchestre
    setSelectedMorceaux([]);
  };

  const toggleMorceau = (morceauId: string) => {
    setSelectedMorceaux(prev => 
      prev.includes(morceauId) 
        ? prev.filter(id => id !== morceauId)
        : [...prev, morceauId]
    );
  };

  const toggleInstrument = (instrumentId: string) => {
    setSelectedInstruments(prev => 
      prev.includes(instrumentId) 
        ? prev.filter(id => id !== instrumentId)
        : [...prev, instrumentId]
    );
  };

  const clearAllFilters = () => {
    setSelectedOrchestras([]);
    setSelectedMorceaux([]);
    setSelectedInstruments([]);
    setSearchTerm('');
  };

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
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="font-poppins font-bold text-3xl text-dark">
                  Gestion des partitions
                </h1>
                <p className="font-inter text-gray-600">
                  Gérez les partitions de l'école
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span>Ajouter une partition</span>
            </button>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-4">
            <span className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span>{filteredPartitions.length} partition{filteredPartitions.length > 1 ? 's' : ''} {searchTerm && `sur ${partitions.length}`}</span>
            </span>
          </div>
        </div>

        {/* Filtres compacts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="space-y-4">
            {/* Recherche */}
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-800">Filtres</h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-64 text-sm"
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

            {/* Filtre Orchestres */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Orchestres</label>
                <div className="flex items-center space-x-2 text-xs">
                  <button 
                    onClick={() => setSelectedOrchestras(orchestras.map(o => o.id))}
                    className="text-primary hover:text-primary/80"
                  >
                    Tout
                  </button>
                  <span className="text-gray-300">|</span>
                  <button 
                    onClick={() => setSelectedOrchestras([])}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Aucun
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {orchestras.map((orchestra) => (
                  <button
                    key={orchestra.id}
                    onClick={() => toggleOrchestra(orchestra.id)}
                    className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedOrchestras.includes(orchestra.id)
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Users className="h-3 w-3" />
                    <span>{orchestra.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filtre Morceaux */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Morceaux {selectedOrchestras.length > 0 && `(${filteredMorceaux.length})`}
                </label>
                <div className="flex items-center space-x-2 text-xs">
                  <button 
                    onClick={() => setSelectedMorceaux(filteredMorceaux.map(m => m.id))}
                    className="text-primary hover:text-primary/80"
                  >
                    Tout
                  </button>
                  <span className="text-gray-300">|</span>
                  <button 
                    onClick={() => setSelectedMorceaux([])}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Aucun
                  </button>
                </div>
              </div>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                <div className="space-y-1">
                  {filteredMorceaux.map((morceau) => (
                    <button
                      key={morceau.id}
                      onClick={() => toggleMorceau(morceau.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        selectedMorceaux.includes(morceau.id)
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="font-medium">{morceau.nom}</div>
                      {morceau.compositeur && (
                        <div className="text-xs text-gray-500">{morceau.compositeur}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filtre Instruments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Instruments</label>
                <div className="flex items-center space-x-2 text-xs">
                  <button 
                    onClick={() => setSelectedInstruments(instruments.map(i => i.id))}
                    className="text-primary hover:text-primary/80"
                  >
                    Tout
                  </button>
                  <span className="text-gray-300">|</span>
                  <button 
                    onClick={() => setSelectedInstruments([])}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Aucun
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {instruments.map((instrument) => (
                  <button
                    key={instrument.id}
                    onClick={() => toggleInstrument(instrument.id)}
                    className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedInstruments.includes(instrument.id)
                        ? 'bg-accent text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Music className="h-3 w-3" />
                    <span>{instrument.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Résumé des filtres */}
            {(selectedOrchestras.length > 0 || selectedMorceaux.length > 0 || selectedInstruments.length > 0 || searchTerm) && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {filteredPartitions.length} partition{filteredPartitions.length > 1 ? 's' : ''} trouvée{filteredPartitions.length > 1 ? 's' : ''}
                </div>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Réinitialiser tous les filtres
                </button>
              </div>
            )}
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
                      {editingPartition ? <Edit className="h-6 w-6 text-primary" /> : <Plus className="h-6 w-6 text-primary" />}
                    </div>
                    <h2 className="font-poppins font-semibold text-xl text-dark">
                      {editingPartition ? 'Modifier la partition' : 'Ajouter une partition'}
                    </h2>
                  </div>
                  <button
                    onClick={cancelEdit}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={editingPartition ? handleUpdate : handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Titre de la partition
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Ex: Partition de violon..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">
                        Morceau
                      </label>
                      <select
                        name="morceau_id"
                        value={formData.morceau_id}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        required
                      >
                        <option value="">Sélectionner un morceau</option>
                        {morceaux.map((morceau) => (
                          <option key={morceau.id} value={morceau.id}>
                            {morceau.nom} {morceau.compositeur && `- ${morceau.compositeur}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">
                        Instrument
                      </label>
                      <select
                        name="instrument_id"
                        value={formData.instrument_id}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        required
                      >
                        <option value="">Sélectionner un instrument</option>
                        {instruments.map((instrument) => (
                          <option key={instrument.id} value={instrument.id}>
                            {instrument.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Fichier de partition {editingPartition && '(laisser vide pour garder le fichier actuel)'}
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,image/*"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer text-primary hover:text-primary/80 font-medium"
                      >
                        Cliquez pour sélectionner un fichier
                      </label>
                      <p className="text-sm text-gray-500 mt-1">
                        PDF ou image (JPG, PNG)
                      </p>
                      {selectedFile && (
                        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      {loading ? 'En cours...' : (editingPartition ? 'Mettre à jour' : 'Créer')}
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
        {deleteConfirmation.isOpen && deleteConfirmation.partition && (
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
                    Êtes-vous sûr de vouloir supprimer la partition{' '}
                    <span className="font-semibold text-dark">
                      {deleteConfirmation.partition.title}
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

        {/* Liste des partitions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-poppins font-semibold text-lg text-dark">
              Liste des partitions
            </h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement...</p>
            </div>
          ) : filteredPartitions.length === 0 && (searchTerm || selectedOrchestras.length > 0 || selectedMorceaux.length > 0 || selectedInstruments.length > 0) ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>Aucune partition trouvée avec les filtres sélectionnés</p>
              <button onClick={clearAllFilters} className="text-primary hover:text-primary/80 mt-2">Réinitialiser les filtres</button>
            </div>
          ) : partitions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>Aucune partition trouvée</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredPartitions.map((partition) => (
                <div key={partition.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-dark text-lg">
                            {partition.title}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Music className="h-3 w-3 mr-1" />
                            {partition.instrument?.name || 'Instrument non défini'}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Morceau :</span> {partition.morceaux.nom}
                          {partition.morceaux.compositeur && (
                            <span className="text-gray-500"> - {partition.morceaux.compositeur}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                          <span className="flex items-center space-x-1">
                            <FileText className="h-4 w-4" />
                            <span>{partition.file_name}</span>
                          </span>
                          <span>
                            {(partition.file_size / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <span>
                            Ajouté le {new Date(partition.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        
                        {partition.morceaux.morceau_orchestras && partition.morceaux.morceau_orchestras.length > 0 && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Users className="h-3 w-3" />
                            <span>{partition.morceaux.morceau_orchestras.map(mo => mo.orchestras.name).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => window.open(partition.file_path, '_blank')}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200"
                        title="Voir la partition"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <a
                        href={partition.file_path}
                        download={partition.file_name}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        title="Télécharger"
                      >
                        <Download className="h-5 w-5" />
                      </a>
                      <button
                        onClick={() => handleEdit(partition)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        title="Modifier"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => confirmDelete(partition)}
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

export default AdminPartitions;