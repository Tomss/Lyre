import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, FileText, Search, X, CheckCircle, ArrowLeft, Upload, Music, Users, Download, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
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
  instruments: {
    id: string;
    name: string;
  };
  morceaux?: {
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
  orchestras?: Array<{
    id: string;
    name: string;
  }>;
}

interface Morceau {
  id: string;
  nom: string;
  compositeur: string | null;
  arrangement: string | null;
  orchestras: Array<{
    id: string;
    name: string;
  }>;
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
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedMorceauId = searchParams.get('morceau');
  
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [morceaux, setMorceaux] = useState<Morceau[]>([]);
  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [morceauFilter, setMorceauFilter] = useState<string>(selectedMorceauId || '');
  const [instrumentFilter, setInstrumentFilter] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPartition, setEditingPartition] = useState<Partition | null>(null);
  const [selectedOrchestra, setSelectedOrchestra] = useState<string>('');
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
    morceau_id: selectedMorceauId || '',
    instrument_id: '',
    title: '',
    orchestra_id: '',
  });
  const [selectedOrchestraForForm, setSelectedOrchestraForForm] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

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
      let url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-partitions?type=admin`;
      if (morceauFilter) {
        url += `&morceauId=${morceauFilter}`;
      }

      const response = await fetch(url, {
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

  // Récupérer tous les morceaux
  const fetchMorceaux = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-morceaux`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMorceaux(data || []);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des morceaux:', err);
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

      if (response.ok) {
        const data = await response.json();
        setInstruments(data || []);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des instruments:', err);
    }
  };

  const fetchOrchestras = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-orchestras`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('HTTP error! status: ' + response.status);
      const data = await response.json();
      setOrchestras(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des orchestres:', error);
    }
  };

  useEffect(() => {
    if (profile?.role === 'Admin' || profile?.role === 'Gestionnaire') {
      fetchMorceaux();
      fetchInstruments();
      fetchOrchestras();
    }
  }, [profile]);

  useEffect(() => {
    if (morceaux.length > 0) {
      fetchPartitions();
    }
  }, [morceauFilter, morceaux]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  // Upload du fichier vers Supabase Storage
  const uploadFile = async (file: File): Promise<any | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `partition_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `partitions/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media-files')
        .upload(filePath, file);
        
      if (uploadError) {
        console.error('Erreur upload fichier:', uploadError);
        throw uploadError;
      }
      
      // Récupération de l'URL publique
      const { data: urlData } = supabase.storage
        .from('media-files')
        .getPublicUrl(filePath);
        
      return {
        file_name: file.name,
        file_path: urlData.publicUrl,
        file_type: file.type.includes('pdf') ? 'pdf' : 'image',
        file_size: file.size,
        mime_type: file.type
      };
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
      showNotification('Erreur lors de l\'upload du fichier', 'error');
      return null;
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
      const fileData = await uploadFile(selectedFile);
      if (!fileData) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-partitions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          ...formData,
          ...fileData,
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
      let fileData = {};
      
      // Upload du nouveau fichier si sélectionné
      if (selectedFile) {
        const uploadedFile = await uploadFile(selectedFile);
        if (!uploadedFile) {
          setLoading(false);
          return;
        }
        fileData = uploadedFile;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-partitions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          id: editingPartition.id,
          ...formData,
          ...fileData,
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
    if (!partition.morceaux) {
      showNotification('Impossible de modifier cette partition : données du morceau manquantes', 'error');
      return;
    }
    
    // Trouver l'orchestre de cette partition via le morceau
    const orchestraId = partition.morceaux.morceau_orchestras?.[0]?.orchestra_id || '';
    
    setEditingPartition(partition);
    setFormData({
      morceau_id: partition.morceaux.id,
      instrument_id: partition.instruments.id,
      title: partition.title,
      orchestra_id: orchestraId,
    });
    setSelectedOrchestraForForm(orchestraId);
    setSelectedFile(null);
    setFilePreview(null);
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingPartition(null);
    setShowAddForm(false);
    setFormData({
      morceau_id: selectedMorceauId || '',
      instrument_id: '',
      title: '',
      orchestra_id: '',
    });
    setSelectedOrchestraForForm('');
    setSelectedFile(null);
    setFilePreview(null);
  };

  const toggleInstrumentFilter = (instrumentId: string) => {
    setInstrumentFilter(prev => 
      prev.includes(instrumentId) 
        ? prev.filter(id => id !== instrumentId)
        : [...prev, instrumentId]
    );
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'bg-red-100 text-red-800';
      case 'image': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filtrer les partitions
  const filteredPartitions = partitions.filter(partition => {
    // Skip partitions without morceaux data
    if (!partition.morceaux) return false;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      partition.morceaux?.nom?.toLowerCase().includes(searchLower) ||
      partition.title.toLowerCase().includes(searchLower) ||
      partition.instruments.name.toLowerCase().includes(searchLower) ||
      (partition.morceaux?.compositeur && partition.morceaux.compositeur.toLowerCase().includes(searchLower)) ||
      (partition.morceaux?.arrangement && partition.morceaux.arrangement.toLowerCase().includes(searchLower))
    );
    
    const matchesInstrument = instrumentFilter.length === 0 || instrumentFilter.includes(partition.instruments.id);
    const matchesMorceau = !morceauFilter || partition.morceaux?.id === morceauFilter;
    
    return matchesSearch && matchesInstrument && matchesMorceau;
  });

  // Filtrer les morceaux par orchestre pour le formulaire
  const filteredMorceauxForForm = morceaux.filter(morceau => {
    if (!selectedOrchestraForForm) return true;
    return morceau.orchestras.some(o => o.id === selectedOrchestraForForm);
  });

  // Effet pour auto-sélectionner l'orchestra_id quand un morceau est choisi
  useEffect(() => {
    if (formData.morceau_id) {
      const selectedMorceau = morceaux.find(m => m.id === formData.morceau_id);
      if (selectedMorceau?.orchestras.length === 1) {
        // Auto-sélection si un seul orchestre
        setFormData(prev => ({ ...prev, orchestra_id: selectedMorceau.orchestras[0].id }));
      } else if (selectedMorceau?.orchestras.length === 0) {
        // Réinitialiser si aucun orchestre
        setFormData(prev => ({ ...prev, orchestra_id: '' }));
      }
    }
  }, [formData.morceau_id, morceaux]);

  // Grouper par morceau
  const partitionsByMorceau = filteredPartitions.reduce((acc, partition) => {
    if (!partition.morceaux) return acc;
    
    const morceauKey = partition.morceaux.id;
    if (!acc[morceauKey]) {
      acc[morceauKey] = {
        morceau: partition.morceaux,
        partitions: []
      };
    }
    acc[morceauKey].partitions.push(partition);
    return acc;
  }, {} as Record<string, { morceau: any; partitions: Partition[] }>);

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
                to={selectedMorceauId ? "/admin/morceaux" : "/dashboard"}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-2"
                title={selectedMorceauId ? "Retour aux morceaux" : "Retour au dashboard"}
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
                  Gérez les partitions par morceau et instrument
                </p>
                {selectedMorceauId && morceaux.length > 0 && (
                  <p className="font-inter text-sm text-primary mt-1">
                    Filtré par : {morceaux.find(m => m.id === selectedMorceauId)?.nom}
                  </p>
                )}
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
            <Link
              to="/admin/morceaux"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Gérer les morceaux →
            </Link>
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
                  {/* Filtre par orchestre pour les morceaux */}
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Filtrer les morceaux par orchestre (optionnel)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => setSelectedOrchestraForForm('')}
                        className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedOrchestraForForm === ''
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        <Users className="h-4 w-4" />
                        <span>Tous les orchestres</span>
                      </button>
                      {orchestras.map((orchestra) => (
                        <button
                          key={orchestra.id}
                          type="button"
                          onClick={() => setSelectedOrchestraForForm(orchestra.id)}
                          className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            selectedOrchestraForForm === orchestra.id
                              ? 'bg-primary text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                          }`}
                        >
                          <Users className="h-4 w-4" />
                          <span>{orchestra.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sélection d'orchestre si le morceau en a plusieurs */}
                  {formData.morceau_id && (() => {
                    const selectedMorceau = morceaux.find(m => m.id === formData.morceau_id);
                    return selectedMorceau?.orchestras.length > 1 ? (
                      <div>
                        <label className="block text-sm font-medium text-dark mb-2">
                          Orchestre <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="orchestra_id"
                          value={formData.orchestra_id}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                          required
                        >
                          <option value="">Sélectionner un orchestre</option>
                          {selectedMorceau.orchestras.map((orchestra) => (
                            <option key={orchestra.id} value={orchestra.id}>
                              {orchestra.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Ce morceau est joué par plusieurs orchestres
                        </p>
                      </div>
                    ) : null;
                  })()}

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
                        {filteredMorceauxForForm.map((morceau) => (
                          <option key={morceau.id} value={morceau.id}>
                            {morceau.nom} {morceau.compositeur && `- ${morceau.compositeur}`}
                          </option>
                        ))}
                      </select>
                      {selectedOrchestraForForm && (
                        <p className="text-xs text-gray-500 mt-1">
                          Affichage des morceaux de : {orchestras.find(o => o.id === selectedOrchestraForForm)?.name}
                        </p>
                      )}
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
                     Titre de la partition
                   </label>
                   <input
                     type="text"
                     name="title"
                     value={formData.title}
                     onChange={handleInputChange}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                     placeholder="Ex: Partition principale, Solo, etc."
                     required
                   />
                 </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      {editingPartition ? 'Remplacer le fichier (optionnel)' : 'Fichier de la partition'}
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {filePreview ? (
                        <div className="relative">
                          <img
                            src={filePreview}
                            alt="Prévisualisation"
                            className="max-w-full h-32 object-contain rounded-lg mx-auto mb-4"
                          />
                          <button
                            type="button"
                            onClick={removeFile}
                            className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transform translate-x-2 -translate-y-2"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                        </div>
                      ) : selectedFile ? (
                        <div className="relative">
                          <div className="bg-red-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-8 w-8 text-red-600" />
                          </div>
                          <button
                            type="button"
                            onClick={removeFile}
                            className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transform translate-x-2 -translate-y-2"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <p className="text-sm text-gray-600">{selectedFile.name}</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <input
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                            accept=".pdf,image/*"
                            required={!editingPartition}
                          />
                          <label
                            htmlFor="file-upload"
                            className="cursor-pointer text-primary hover:text-primary/80 font-medium"
                          >
                            {editingPartition ? 'Cliquez pour remplacer le fichier' : 'Cliquez pour sélectionner un fichier'}
                          </label>
                          <p className="text-sm text-gray-500 mt-2">
                            PDF ou image (JPG, PNG) jusqu'à 10MB
                          </p>
                        </>
                      )}
                    </div>
                    
                    {editingPartition && !selectedFile && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-800 font-medium">Fichier actuel :</span>
                          <span className="text-sm text-blue-700">{editingPartition.file_name}</span>
                        </div>
                      </div>
                    )}
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
                      {deleteConfirmation.partition.morceaux?.nom || 'Morceau inconnu'} - {deleteConfirmation.partition.instruments.name}
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

        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Recherche */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher une partition..."
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

            {/* Filtres */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Filtre par morceau */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Morceau :</span>
                <select
                  value={morceauFilter}
                  onChange={(e) => setMorceauFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Tous les morceaux</option>
                  {morceaux.map((morceau) => (
                    <option key={morceau.id} value={morceau.id}>
                      {morceau.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre par instrument */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Instruments :</span>
                <div className="flex flex-wrap gap-1">
                  {instruments.map((instrument) => (
                    <button
                      key={instrument.id}
                      onClick={() => toggleInstrumentFilter(instrument.id)}
                      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                        instrumentFilter.includes(instrument.id)
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      <Music className="h-3 w-3" />
                      <span>{instrument.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des partitions groupées par morceau */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement...</p>
          </div>
        ) : Object.keys(partitionsByMorceau).length === 0 && searchTerm ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>Aucune partition trouvée pour "{searchTerm}"</p>
            <button onClick={() => setSearchTerm('')} className="text-primary hover:text-primary/80 mt-2">Effacer la recherche</button>
          </div>
        ) : partitions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Aucune partition trouvée</p>
            <p className="text-sm">Commencez par créer des morceaux, puis ajoutez leurs partitions.</p>
            <Link
              to="/admin/morceaux"
              className="inline-block mt-4 text-primary hover:text-primary/80 font-medium"
            >
              Gérer les morceaux →
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(partitionsByMorceau).map(([morceauId, { morceau, partitions }]) => (
              <div key={morceauId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-accent/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-poppins font-semibold text-xl text-dark flex items-center space-x-2">
                        <Music className="h-6 w-6 text-primary" />
                        <span>{morceau.nom}</span>
                      </h2>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                        {morceau.compositeur && (
                          <span>Compositeur : {morceau.compositeur}</span>
                        )}
                        {morceau.arrangement && (
                          <span>Arrangement : {morceau.arrangement}</span>
                        )}
                      </div>
                      {morceau.morceau_orchestras && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                          <Users className="h-3 w-3" />
                          <span>{morceau.morceau_orchestras.map(mo => mo.orchestras.name).join(', ')}</span>
                        </div>
                      )}
                    </div>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                      {partitions.length} partition{partitions.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {partitions.map((partition) => (
                    <div key={partition.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="bg-primary/10 p-3 rounded-lg">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Music className="h-3 w-3 mr-1" />
                                {partition.instruments.name}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFileTypeColor(partition.file_type)}`}>
                                {partition.file_type.toUpperCase()}
                              </span>
                            </div>
                            
                            <h4 className="font-medium text-gray-800 mb-2">
                              {partition.title}
                            </h4>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                              <span className="flex items-center space-x-1">
                                <FileText className="h-4 w-4" />
                                <span>{partition.file_name}</span>
                              </span>
                              <span>
                                Ajouté le {new Date(partition.created_at).toLocaleDateString('fr-FR')}
                              </span>
                              {partition.profiles && (
                                <span>Par {partition.profiles.first_name} {partition.profiles.last_name}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-400">
                                {(partition.file_size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
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
                            className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-all duration-200"
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPartitions;