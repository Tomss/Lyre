import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, FileText, Search, X, CheckCircle, ArrowLeft, Upload, Music, Download, Users, Music2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

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
  const { profile } = useAuth();
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [morceaux, setMorceaux] = useState<Morceau[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [orchestraFilter, setOrchestraFilter] = useState<string[]>([]);
  const [morceauFilter, setMorceauFilter] = useState<string[]>([]);
  const [instrumentFilter, setInstrumentFilter] = useState<string[]>([]);
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
    nom: '',
    morceau_id: '',
    instrument_id: '',
  });
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMorceaux(data || []);
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setInstruments(data || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des instruments:', err);
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

  useEffect(() => {
    if (profile?.role === 'Admin' || profile?.role === 'Gestionnaire') {
      fetchPartitions();
      fetchMorceaux();
      fetchInstruments();
      fetchOrchestras();
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
  const uploadFile = async (file: File): Promise<any> => {
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
        file_path: urlData.publicUrl,
        file_name: file.name,
        file_type: file.type.includes('pdf') ? 'pdf' : 'image',
        file_size: file.size
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
    setLoading(true);

    try {
      let fileData = {};
      
      // Upload du fichier si sélectionné
      if (selectedFile) {
        const uploadResult = await uploadFile(selectedFile);
        if (!uploadResult) {
          setLoading(false);
          return;
        }
        fileData = uploadResult;
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
      let fileData = {
        file_path: editingPartition.file_path,
        file_name: editingPartition.file_name,
        file_type: editingPartition.file_type,
        file_size: editingPartition.file_size
      };
      
      // Upload du nouveau fichier si sélectionné
      if (selectedFile) {
        const uploadResult = await uploadFile(selectedFile);
        if (!uploadResult) {
          setLoading(false);
          return;
        }
        fileData = uploadResult;
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

  const toggleMorceauFilter = (morceauId: string) => {
    setMorceauFilter(prev => 
      prev.includes(morceauId) 
        ? prev.filter(id => id !== morceauId)
        : [...prev, morceauId]
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
    setMorceauFilter([]);
    setInstrumentFilter([]);
    setSearchTerm('');
  };

  // Filtrer les partitions
  const filteredPartitions = partitions.filter(partition => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      partition.nom.toLowerCase().includes(searchLower) ||
      partition.morceaux.nom.toLowerCase().includes(searchLower) ||
      (morceau.orchestras && morceau.orchestras.some(o => o.name.toLowerCase().includes(searchLower)))
    );
    
    // Filtrer par orchestre (via le morceau)
    const matchesOrchestra = orchestraFilter.length === 0 || 
      orchestraFilter.some(orchestraId => 
        partition.morceaux.orchestras?.some(o => o.id === orchestraId)
      );
    
    // Filtrer par morceau
    const matchesMorceau = morceauFilter.length === 0 || 
      morceauFilter.includes(partition.morceau_id);
    
    // Filtrer par instrument
    const matchesInstrument = instrumentFilter.length === 0 || 
      instrumentFilter.includes(partition.instrument_id);
    
    return matchesSearch && matchesOrchestra && matchesMorceau && matchesInstrument;
  });

  const openFile = (partition: Partition) => {
    if (partition.file_path) {
      window.open(partition.file_path, '_blank');
    }
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
                  Gérez les partitions par morceau et instrument
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
                      Nom de la partition
                    </label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Ex: Partition violon 1, Partition piano..."
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
                            {morceau.nom}
                            {morceau.compositeur && ` - ${morceau.compositeur}`}
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
                    <label className="block text-sm font-medium text-dark mb-3">
                      Fichier partition (PDF ou image)
                    </label>
                    
                    {/* Zone d'upload */}
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
                          <p className="text-sm text-gray-600">
                            {selectedFile ? selectedFile.name : 'Fichier actuel'}
                          </p>
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
                      ) : editingPartition?.file_path ? (
                        <div className="relative">
                          <div className="bg-gray-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-8 w-8 text-gray-600" />
                          </div>
                          <p className="text-sm text-gray-600">
                            {editingPartition.file_name || 'Fichier existant'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Sélectionnez un nouveau fichier pour le remplacer
                          </p>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                          />
                          <label
                            htmlFor="file-upload"
                            className="cursor-pointer text-primary hover:text-primary/80 font-medium"
                          >
                            Cliquez pour sélectionner un fichier
                          </label>
                          <p className="text-sm text-gray-500 mt-2">
                            PDF ou image (JPG, PNG) jusqu'à 10MB
                          </p>
                        </>
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
                      {deleteConfirmation.partition.nom}
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-poppins font-semibold text-lg text-dark">
                Liste des partitions
              </h3>
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
            </div>
            
            {/* Filtres dynamiques */}
            <div className="space-y-4">
              {/* Filtres par orchestre */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>Filtrer par orchestre :</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {orchestras.map((orchestra) => (
                    <button
                      key={orchestra.id}
                      onClick={() => toggleOrchestraFilter(orchestra.id)}
                      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        orchestraFilter.includes(orchestra.id)
                          ? 'bg-blue-100 text-blue-800 border border-blue-200 shadow-sm'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      <Users className="h-3 w-3" />
                      <span>{orchestra.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtres par morceau */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                  <Music className="h-4 w-4 text-gray-500" />
                  <span>Filtrer par morceau :</span>
                </h4>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {morceaux.map((morceau) => (
                    <button
                      key={morceau.id}
                      onClick={() => toggleMorceauFilter(morceau.id)}
                      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        morceauFilter.includes(morceau.id)
                          ? 'bg-green-100 text-green-800 border border-green-200 shadow-sm'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      <Music className="h-3 w-3" />
                      <span>{morceau.nom}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtres par instrument */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                  <Music2 className="h-4 w-4 text-gray-500" />
                  <span>Filtrer par instrument :</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {instruments.map((instrument) => (
                    <button
                      key={instrument.id}
                      onClick={() => toggleInstrumentFilter(instrument.id)}
                      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        instrumentFilter.includes(instrument.id)
                          ? 'bg-purple-100 text-purple-800 border border-purple-200 shadow-sm'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      <Music2 className="h-3 w-3" />
                      <span>{instrument.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions de filtrage */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{filteredPartitions.length} partition{filteredPartitions.length > 1 ? 's' : ''} trouvée{filteredPartitions.length > 1 ? 's' : ''}</span>
                  {(orchestraFilter.length > 0 || morceauFilter.length > 0 || instrumentFilter.length > 0 || searchTerm) && (
                    <span className="text-orange-600">
                      • Filtres actifs
                    </span>
                  )}
                </div>
                {(orchestraFilter.length > 0 || morceauFilter.length > 0 || instrumentFilter.length > 0 || searchTerm) && (
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center space-x-2 text-sm text-red-600 hover:text-red-700 font-medium transition-colors bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200"
                  >
                    <X className="h-3 w-3" />
                    <span>Réinitialiser tous les filtres</span>
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
          ) : filteredPartitions.length === 0 && searchTerm ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>Aucune partition trouvée pour "{searchTerm}"</p>
              <button onClick={() => setSearchTerm('')} className="text-primary hover:text-primary/80 mt-2">Effacer la recherche</button>
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
                            {partition.nom}
                          </h3>
                          {partition.file_path && (
                            <button
                              onClick={() => openFile(partition)}
                              className="inline-flex items-center space-x-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                            >
                              <Download className="h-3 w-3" />
                              <span>Ouvrir</span>
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">Morceau :</span> {partition.morceaux.nom}
                            {partition.morceaux.compositeur && (
                              <span className="text-gray-500"> - {partition.morceaux.compositeur}</span>
                            )}
                          </div>
                          <div>
                            <span className="font-medium">Instrument :</span> {partition.instruments.name}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                          <span>
                            Créée le {new Date(partition.created_at).toLocaleDateString('fr-FR')}
                          </span>
                          {partition.file_path && (
                            <span className="flex items-center space-x-1">
                              <FileText className="h-3 w-3" />
                              <span>{partition.file_type?.toUpperCase()}</span>
                              {partition.file_size && (
                                <span>• {(partition.file_size / 1024 / 1024).toFixed(2)} MB</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
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