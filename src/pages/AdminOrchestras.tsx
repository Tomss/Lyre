import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, Search, X, CheckCircle, ArrowLeft, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const API_URL = 'http://localhost:3001/api';

interface Orchestra {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  photos?: { id: string; photo_url: string; display_order: number }[];
  created_at: string;
}

interface DeleteConfirmation {
  isOpen: boolean;
  orchestra: Orchestra | null;
}

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

function SortableItem(props: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {props.children}
    </div>
  );
}

const AdminOrchestras = () => {
  const { currentUser, token, isAuthenticated } = useAuth();
  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOrchestra, setEditingOrchestra] = useState<Orchestra | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({ isOpen: false, orchestra: null });
  const [notification, setNotification] = useState<Notification>({ show: false, message: '', type: 'success' });
  const [formData, setFormData] = useState({ name: '', description: '' });
  // Unified photo management
  const [photos, setPhotos] = useState<{ id?: string, url: string, file?: File }[]>([]);

  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrchestras((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Save new order to backend
        const saveOrder = async () => {
          try {
            await fetch(`${API_URL}/orchestras/reorder`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ orderedIds: newItems.map(i => i.id) })
            });
          } catch (err) {
            console.error("Failed to save order", err);
            showNotification("Erreur lors de la sauvegarde de l'ordre", 'error');
          }
        };
        saveOrder();

        return newItems;
      });
    }
  };

  const toggleDescription = (id: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchOrchestras = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/orchestras`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Erreur de chargement des orchestres');
      const data = await response.json();
      setOrchestras(data || []);
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated && currentUser?.role === 'Admin') {
      fetchOrchestras();
    }
  }, [isAuthenticated, currentUser, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).map(file => ({
        url: URL.createObjectURL(file),
        file
      }));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };



  const processFormSubmission = async () => {
    // 1. Upload new files
    const processedPhotos = await Promise.all(photos.map(async (photo) => {
      if (photo.file) {
        const photoFormData = new FormData();
        photoFormData.append('file', photo.file);
        const uploadResponse = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: photoFormData,
        });
        if (!uploadResponse.ok) throw new Error(`Echec upload: ${photo.file.name}`);
        const uploadResult = await uploadResponse.json();
        return { url: uploadResult.filePath }; // New photo, no ID yet
      }
      return photo; // Existing photo with ID and URL
    }));

    // For backward compatibility, set photo_url to the first photo's URL
    const mainPhotoUrl = processedPhotos.length > 0 ? processedPhotos[0].url : null;

    const url = editingOrchestra ? `${API_URL}/orchestras/${editingOrchestra.id}` : `${API_URL}/orchestras`;
    const method = editingOrchestra ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...formData,
        photo_url: mainPhotoUrl,
        photos: processedPhotos
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Une erreur est survenue');
    }

    return response.json();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await processFormSubmission();
      showNotification(result.message);
      cancelEdit();
      fetchOrchestras();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirmation.orchestra || !token) return;
    try {
      const response = await fetch(`${API_URL}/orchestras/${deleteConfirmation.orchestra.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur de suppression');
      }
      const result = await response.json();
      showNotification(result.message);
      fetchOrchestras();
      setDeleteConfirmation({ isOpen: false, orchestra: null });
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleEdit = (orchestra: Orchestra) => {
    setEditingOrchestra(orchestra);
    setFormData({ name: orchestra.name, description: orchestra.description || '' });

    // Initialize photos state with existing photos
    // If orchestra has new 'photos' array, use it. Fallback to single 'photo_url'
    let initialPhotos: { id?: string, url: string, file?: File }[] = [];

    if (orchestra.photos && orchestra.photos.length > 0) {
      initialPhotos = orchestra.photos.map(p => ({ id: p.id, url: p.photo_url }));
    } else if (orchestra.photo_url) {
      // Fallback for migration
      initialPhotos = [{ url: orchestra.photo_url }];
    }

    setPhotos(initialPhotos);
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingOrchestra(null);
    setShowAddForm(false);
    setFormData({ name: '', description: '' });
    setPhotos([]);
  };

  const filteredOrchestras = orchestras.filter(orchestra =>
    orchestra.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (orchestra.description && orchestra.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isAuthenticated && currentUser?.role !== 'Admin') {
    return <Navigate to="/dashboard" />;
  }

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
              <Users className="mr-3 h-8 w-8 text-indigo-600" />
              Gestion des Orchestres
            </h1>
            <button onClick={() => { setEditingOrchestra(null); setShowAddForm(true); }} className="flex items-center px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
              <Plus className="mr-2 h-5 w-5" />
              Ajouter un orchestre
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un orchestre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Orchestra List */}
        {loading ? (
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Chargement des orchestres...</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="bg-white rounded-xl shadow-lg border border-gray-200/80 overflow-hidden">
              <SortableContext
                items={filteredOrchestras.map(o => o.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y divide-gray-200/80">
                  {filteredOrchestras.map((orchestra) => (
                    <SortableItem key={orchestra.id} id={orchestra.id}>
                      <div className={`p-4 flex items-start hover:bg-gray-50/50 transition-colors duration-200 bg-white`}>
                        {/* Drag Handle Icon (Optional visual cue, using cursor-move usually suffices but icon is nice) */}
                        <div className="mr-4 mt-2 cursor-grab text-gray-400 hover:text-gray-600">
                          <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor"><path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path></svg>
                        </div>

                        <img src={orchestra.photo_url || 'https://via.placeholder.com/100x100'} alt={orchestra.photo_url ? `Photo de ${orchestra.name}` : ''} className="w-16 h-16 object-cover rounded-md mr-4 flex-shrink-0" />
                        <div className="flex-grow">
                          <p className="font-bold text-lg text-gray-800">{orchestra.name}</p>
                          <p className="text-gray-600 text-sm">
                            {orchestra.description && orchestra.description.length > 100 && !expandedDescriptions.has(orchestra.id)
                              ? `${orchestra.description.substring(0, 100)}...`
                              : orchestra.description}
                          </p>
                          {orchestra.description && orchestra.description.length > 100 && (
                            <button onClick={() => toggleDescription(orchestra.id)} className="text-blue-600 text-sm hover:underline mt-1 bg-transparent border-none cursor-pointer">
                              {expandedDescriptions.has(orchestra.id) ? 'Réduire' : 'Lire la suite'}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                          <button onClick={() => handleEdit(orchestra)} className="p-2 text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors duration-200"><Edit size={18} /></button>
                          <button onClick={() => setDeleteConfirmation({ isOpen: true, orchestra })} className="p-2 text-red-600 bg-red-100 hover:bg-red-200 rounded-full transition-colors duration-200"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </div>
          </DndContext>
        )}

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-5 border-b">
                <h2 className="text-2xl font-bold text-gray-800">{editingOrchestra ? 'Modifier' : 'Ajouter'} un orchestre</h2>
                <button onClick={cancelEdit} className="p-2 rounded-full hover:bg-gray-200"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Nom de l'orchestre" required className="w-full px-4 py-2 border rounded-lg" />
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" className="w-full px-4 py-2 border rounded-lg h-24"></textarea>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img src={photo.url} alt={`Photo ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                          {index === 0 && (
                            <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">Principale</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-center w-full">
                      <label htmlFor="photo-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Plus className="w-8 h-8 mb-4 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Cliquez pour ajouter</span></p>
                          <p className="text-xs text-gray-500">PNG, JPG (MAX. 50MB)</p>
                        </div>
                        <input id="photo-upload" type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t">
                  <button type="button" onClick={cancelEdit} className="mr-4 px-6 py-2 rounded-lg border hover:bg-gray-100">Annuler</button>
                  <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:bg-blue-300">
                    {loading ? 'Enregistrement...' : (editingOrchestra ? 'Mettre à jour' : 'Créer')}
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
              <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer l'orchestre <span className="font-bold">{deleteConfirmation.orchestra?.name}</span> ? Cette action est irréversible.</p>
              <div className="flex justify-end space-x-4">
                <button onClick={() => setDeleteConfirmation({ isOpen: false, orchestra: null })} className="px-6 py-2 rounded-lg border hover:bg-gray-100">Annuler</button>
                <button onClick={handleDelete} className="bg-red-600 text-white px-6 py-2 rounded-lg shadow hover:bg-red-700">Supprimer</button>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification.show && (
          <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            <div className="flex items-center">
              <CheckCircle size={20} className="mr-2" />
              {notification.message}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminOrchestras;
