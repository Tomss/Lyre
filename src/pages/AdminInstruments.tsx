import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, Music, Search, X, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

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
    teacher: '',
    description: '',
  });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Logos prédéfinis pour les instruments
  const predefinedLogos = {
    // Instruments à cordes
    'Piano': '🎹',
    'Violon': '🎻',
    'Violoncelle': '🎻',
    'Contrebasse': '🎻',
    'Alto': '🎻',
    'Guitare': '🎸',
    'Guitare classique': '🎸',
    'Guitare électrique': '🎸',
    'Basse': '🎸',
    'Harpe': '🎵',
    'Mandoline': '🎸',
    
    // Instruments à vent - Bois
    'Flûte': '🪈',
    'Flûte traversière': '🪈',
    'Piccolo': '🪈',
    'Clarinette': '🎵',
    'Saxophone': '🎷',
    'Saxophone alto': '🎷',
    'Saxophone ténor': '🎷',
    'Saxophone soprano': '🎷',
    'Hautbois': '🎵',
    'Basson': '🎵',
    'Cor anglais': '🎵',
    
    // Instruments à vent - Cuivres
    'Trompette': '🎺',
    'Cornet': '🎺',
    'Trombone': '🎺',
    'Cor': '📯',
    'Cor d\'harmonie': '📯',
    'Tuba': '🎺',
    'Euphonium': '🎺',
    'Bugle': '🎺',
    
    // Percussions
    'Batterie': '🥁',
    'Percussion': '🥁',
    'Percussions': '🥁',
    'Timbales': '🥁',
    'Xylophone': '🎵',
    'Vibraphone': '🎵',
    'Marimba': '🎵',
    'Cymbales': '🥁',
    'Caisse claire': '🥁',
    'Grosse caisse': '🥁',
    
    // Autres instruments
    'Accordéon': '🪗',
    'Harmonica': '🎵',
    'Orgue': '🎹',
    'Synthétiseur': '🎹',
    'Clavier': '🎹',
    'Chant': '🎤',
    'Voix': '🎤',
    'Formation musicale': '🎼',
    'Solfège': '🎼'
  };

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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Vérifier que c'est une image
      if (!file.type.startsWith('image/')) {
        showNotification('Veuillez sélectionner un fichier image', 'error');
        return;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('L\'image ne doit pas dépasser 5MB', 'error');
        return;
      }
      
      setSelectedPhoto(file);
      
      // Créer une prévisualisation
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

  const usePredefinedLogo = (instrumentName: string) => {
    const logo = predefinedLogos[instrumentName as keyof typeof predefinedLogos];
    if (logo) {
      // Créer une image avec l'emoji comme logo
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 200, 200);
        ctx.font = '120px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(logo, 100, 100);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `${instrumentName.toLowerCase()}-logo.png`, { type: 'image/png' });
            setSelectedPhoto(file);
            setPhotoPreview(canvas.toDataURL());
          }
        });
      }
    }
  };

  // Upload de la photo vers Supabase Storage
  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `instrument_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `instruments/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media-files')
        .upload(filePath, file);
        
      if (uploadError) {
        console.error('Erreur upload photo:', uploadError);
        throw uploadError;
      }
      
      // Récupération de l'URL publique
      const { data: urlData } = supabase.storage
        .from('media-files')
        .getPublicUrl(filePath);
        
      return urlData.publicUrl;
    } catch (error) {
      console.error('Erreur lors de l\'upload de la photo:', error);
      showNotification('Erreur lors de l\'upload de la photo', 'error');
      return null;
    }
  };
  // Créer un instrument
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl = null;
      
      // Upload de la photo si sélectionnée
      if (selectedPhoto) {
        photoUrl = await uploadPhoto(selectedPhoto);
        if (!photoUrl) {
          setLoading(false);
          return; // Arrêter si l'upload a échoué
        }
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-instruments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          name: formData.name,
          teacher: formData.teacher || null,
          description: formData.description || null,
          photo_url: photoUrl,
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
      let photoUrl = editingInstrument.photo_url; // Garder l'ancienne photo par défaut
      
      // Upload de la nouvelle photo si sélectionnée
      if (selectedPhoto) {
        const newPhotoUrl = await uploadPhoto(selectedPhoto);
        if (newPhotoUrl) {
          photoUrl = newPhotoUrl;
        } else {
          setLoading(false);
          return; // Arrêter si l'upload a échoué
        }
      }

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
          teacher: formData.teacher || null,
          description: formData.description || null,
          photo_url: photoUrl,
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

  // Filtrer les instruments selon le terme de recherche
  const filteredInstruments = instruments.filter(instrument => {
    const searchLower = searchTerm.toLowerCase();
    return instrument.name.toLowerCase().includes(searchLower) ||
           (instrument.teacher && instrument.teacher.toLowerCase().includes(searchLower)) ||
           (instrument.description && instrument.description.toLowerCase().includes(searchLower));
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
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">
                        Professeur (optionnel)
                      </label>
                      <input
                        type="text"
                        name="teacher"
                        value={formData.teacher}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Ex: Marie Dupont..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      Description (optionnel)
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                      placeholder="Description de l'instrument ou du cours..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-3">
                      Photo de l'instrument (optionnel)
                    </label>
                    
                    {/* Logo prédéfini */}
                    {formData.name && predefinedLogos[formData.name as keyof typeof predefinedLogos] && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-3xl">{predefinedLogos[formData.name as keyof typeof predefinedLogos]}</span>
                            <span className="text-sm text-blue-700">Logo prédéfini disponible pour {formData.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => usePredefinedLogo(formData.name)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Utiliser
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Zone d'upload */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {photoPreview ? (
                        <div className="relative">
                          <img
                            src={photoPreview}
                            alt="Prévisualisation"
                            className="max-w-full h-32 object-cover rounded-lg mx-auto mb-4"
                          />
                          <button
                            type="button"
                            onClick={removePhoto}
                            className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transform translate-x-2 -translate-y-2"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <p className="text-sm text-gray-600">
                            {selectedPhoto ? selectedPhoto.name : 'Photo actuelle'}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Music className="h-8 w-8 text-gray-400" />
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                            id="photo-upload"
                          />
                          <label
                            htmlFor="photo-upload"
                            className="cursor-pointer text-primary hover:text-primary/80 font-medium"
                          >
                            Cliquez pour sélectionner une photo
                          </label>
                          <p className="text-sm text-gray-500 mt-2">
                            JPG, PNG, GIF jusqu'à 5MB
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
                    <div className="flex items-start space-x-4">
                      {/* Photo ou icône par défaut */}
                      <div className="flex-shrink-0">
                        {instrument.photo_url ? (
                          <img
                            src={instrument.photo_url}
                            alt={instrument.name}
                            className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                            onError={(e) => {
                              // En cas d'erreur, afficher l'icône par défaut
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`bg-primary/10 p-3 rounded-lg flex items-center justify-center w-16 h-16 ${
                            instrument.photo_url ? 'hidden' : 'flex'
                          }`}
                        >
                          <Music className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      
                      {/* Contenu textuel */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-dark text-lg">
                          {instrument.name}
                        </div>
                        {instrument.teacher && (
                          <div className="text-sm text-gray-600 mt-1">
                            Professeur : {instrument.teacher}
                          </div>
                        )}
                        {instrument.description && (
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {instrument.description.length > 100 
                              ? `${instrument.description.substring(0, 100)}...` 
                              : instrument.description
                            }
                          </div>
                        )}
                        <div className="flex items-center space-x-3 mt-2">
                          {instrument.photo_url && (
                            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center space-x-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              <span>Photo</span>
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            Créé le {new Date(instrument.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
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