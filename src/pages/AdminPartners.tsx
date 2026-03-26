import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
// import { API_URL } from '../config'; // Cause of potential issues, using fallback

import { API_URL } from '../config';
import {
    Building2,
    Plus,
    Trash2,
    Edit2,
    GripVertical,
    Search,
    Loader2,
    X,
    Globe,
    Image as ImageIcon,
    CheckCircle,
    AlertCircle,
    ArrowLeft
} from 'lucide-react';
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

interface Partner {
    id: string;
    name: string;
    logo_url: string;
    description: string;
    website_url: string;
    display_order: number;
}

// Sortable Item Component
const SortableItem = ({ id, children }: { id: string, children: React.ReactNode }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        position: 'relative' as 'relative',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <div className={`transition-shadow ${isDragging ? 'shadow-2xl opacity-80' : ''}`}>
                {children}
                <div
                    {...listeners}
                    className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-gray-50 rounded-l-xl touch-none"
                >
                    <GripVertical className="bg-white/50 text-slate-400" />
                </div>
            </div>
        </div>
    );
};

const AdminPartners = () => {
    const { token, currentUser } = useAuth();
    const [partners, setPartners] = useState<Partner[]>([]);

    if (currentUser && currentUser.role !== 'Admin' && (!currentUser.managedModules || !currentUser.managedModules.includes('partners'))) {
      return <Navigate to="/dashboard" />;
    }
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<Partial<Partner>>({ name: '', description: '', website_url: '' });
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (showForm || !!deleteId) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showForm, deleteId]);

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        try {
            const response = await fetch(`${API_URL}/partners`);
            if (response.ok) {
                const data = await response.json();
                setPartners(data);
            }
        } catch (error) {
            console.error('Error fetching partners:', error);
            showNotification('Erreur lors du chargement des partenaires', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = partners.findIndex((item) => item.id === active.id);
            const newIndex = partners.findIndex((item) => item.id === over?.id);

            const newOrder = arrayMove(partners, oldIndex, newIndex);
            setPartners(newOrder); // Optimistic UI update

            // Backend update
            try {
                await fetch(`${API_URL}/partners/reorder`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ items: newOrder.map(p => p.id) })
                });
            } catch (error) {
                console.error('Reorder failed:', error);
                showNotification('Erreur lors de la réorganisation', 'error');
                fetchPartners(); // Revert on error
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            let logoUrl: string | null | undefined = editingPartner?.logo_url;

            // Upload image if new file selected
            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append('file', selectedFile);

                const uploadRes = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: uploadData
                });

                if (!uploadRes.ok) throw new Error('Upload failed');
                const uploadJson = await uploadRes.json();
                logoUrl = uploadJson.filePath;
            } else if (!previewUrl) {
                logoUrl = null;
            }

            const payload = { ...formData, logo_url: logoUrl };
            const url = editingPartner
                ? `${API_URL}/partners/${editingPartner.id}`
                : `${API_URL}/partners`;

            const method = editingPartner ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const text = await res.text();
                try {
                    const errorData = JSON.parse(text);
                    console.error('API Error (JSON):', errorData);
                    throw new Error(errorData.message || 'Operation failed');
                } catch (e) {
                    // If JSON parse fails, use the raw text (truncated)
                    console.error('API Error (Raw):', text);
                    throw new Error(`Erreur serveur (${res.status}): ${text.slice(0, 100)}`);
                }
            }

            showNotification(editingPartner ? 'Partenaire modifié' : 'Partenaire ajouté');
            closeForm();
            fetchPartners();
        } catch (error: any) {
            console.error('HandleSubmit Error:', error);
            showNotification(error.message || 'Une erreur est survenue', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            const res = await fetch(`${API_URL}/partners/${deleteId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                showNotification('Partenaire supprimé');
                fetchPartners();
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            showNotification('Erreur lors de la suppression', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    const openEdit = (partner: Partner) => {
        setEditingPartner(partner);
        setFormData({
            name: partner.name,
            description: partner.description,
            website_url: partner.website_url
        });
        setPreviewUrl(partner.logo_url);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingPartner(null);
        setFormData({ name: '', description: '', website_url: '' });
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const filteredPartners = partners.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="font-inter pt-8 lg:pt-12 pb-20 min-h-screen bg-gray-50">
            <div className="w-full px-4 sm:px-10 lg:px-16">

                {/* Notification Toast */}
                {notification && (
                    <div className={`fixed top-24 right-5 px-6 py-4 rounded-xl shadow-2xl z-[100] text-white font-medium flex items-center animate-fade-in-down ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                        }`}>
                        {notification.type === 'success' ? <CheckCircle className="mr-2 h-5 w-5" /> : <AlertCircle className="mr-2 h-5 w-5" />}
                        {notification.message}
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <Link to="/dashboard" className="text-slate-400 hover:text-indigo-600 transition flex items-center mb-2 group">
                            <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                            Retour au tableau de bord
                        </Link>
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-sm border border-indigo-50 flex-shrink-0">
                                <Building2 size={28} />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 font-poppins">
                                Gestion des Partenaires
                            </h1>
                        </div>
                        <p className="text-slate-500 mt-1">Gérez les logos et liens de vos partenaires.</p>
                    </div>

                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            Ajouter un partenaire
                        </button>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex items-center">
                    <Search className="text-slate-400 mr-3 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Rechercher un partenaire..."
                        className="flex-grow outline-none text-slate-600 placeholder-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Partners List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                    </div>
                ) : filteredPartners.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                        <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">Aucun partenaire trouvé.</p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={filteredPartners.map(p => p.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-4">
                                {filteredPartners.map((partner) => (
                                    <SortableItem key={partner.id} id={partner.id}>
                                        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center pl-14 group hover:border-indigo-100 hover:shadow-md transition-all">
                                            {/* Logo Preview */}
                                            <div className="h-16 w-24 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100 p-2 flex items-center justify-center text-slate-300">
                                                {partner.logo_url ? (
                                                    <img
                                                        src={partner.logo_url}
                                                        alt={partner.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                ) : (
                                                    <Building2 className="h-8 w-8" />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="ml-6 flex-grow">
                                                <h3 className="font-bold text-slate-800 text-lg">{partner.name}</h3>
                                                {partner.website_url && (
                                                    <a href={partner.website_url} target="_blank" rel="noreferrer" className="text-indigo-500 text-sm flex items-center mt-1 hover:underline">
                                                        <Globe className="h-3 w-3 mr-1" />
                                                        {partner.website_url.replace(/^https?:\/\//, '')}
                                                    </a>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 transition-opacity">
                                                <button
                                                    onClick={() => openEdit(partner)}
                                                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-300 hover:scale-110"
                                                    title="Modifier"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(partner.id)}
                                                    className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-300 hover:scale-110"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </SortableItem>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Edit/Create Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex justify-center items-start p-4 pt-24">
                    <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border border-white max-h-[calc(100vh-120px)] animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center p-5 bg-white border-b border-slate-100 flex-shrink-0">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                                    {editingPartner ? <Edit2 size={20} /> : <Plus size={20} />}
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                    {editingPartner ? 'Modifier le partenaire' : 'Nouveau partenaire'}
                                </h2>
                            </div>
                            <button
                                onClick={closeForm}
                                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-slate-50 to-white">
                            
                            {/* Section: Informations générales */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                                    <Building2 size={16} />
                                    <h3 className="text-xs font-bold uppercase tracking-wider">Informations du partenaire</h3>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">

                                {/* Logo Upload */}
                                <div className="flex flex-col items-center">
                                    <div className="relative group cursor-pointer w-full">
                                        <div className={`h-32 w-full rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${previewUrl ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:bg-slate-50'}`}>
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="Preview" className="h-full object-contain p-2" />
                                            ) : (
                                                <div className="text-center text-slate-400">
                                                    <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                                                    <span className="text-sm">Cliquez pour ajouter un logo</span>
                                                </div>
                                            )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    {previewUrl && (
                                        <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <span className="text-white font-medium text-sm">Changer l'image</span>
                                        </div>
                                    )}
                                </div>
                                {previewUrl && (
                                    <button
                                        type="button"
                                        onClick={() => { setPreviewUrl(null); setSelectedFile(null); }}
                                        className="mt-3 text-sm text-red-500 hover:text-red-700 flex items-center font-medium transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4 mr-1.5" />
                                        Supprimer l'image
                                    </button>
                                )}
                            </div>

                                <div>
                                    <label className="flex items-center text-sm font-semibold text-slate-700 mb-1">
                                        Nom du partenaire *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white text-sm"
                                        placeholder="Ex: Mairie de ..."
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center text-sm font-semibold text-slate-700 mb-1">Site Web (Optionnel)</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input
                                            type="url"
                                            value={formData.website_url || ''}
                                            onChange={e => setFormData({ ...formData, website_url: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-slate-50/30 focus:bg-white text-sm"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center text-sm font-semibold text-slate-700 mb-1">Description (Optionnel)</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description || ''}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none bg-slate-50/30 focus:bg-white text-sm"
                                        placeholder="Petite description..."
                                    />
                                </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end p-5 bg-white border-t border-slate-100 gap-3 flex-shrink-0 !mt-auto">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="px-5 py-2.5 text-slate-500 hover:text-slate-700 font-bold transition hover:bg-slate-50 rounded-xl text-sm"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-8 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold transition shadow-lg shadow-indigo-200 flex items-center justify-center text-sm"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                                            Validation...
                                        </>
                                    ) : (editingPartner ? 'Mettre à jour' : 'Ajouter un partenaire')}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-8 m-4 max-w-md w-full">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirmer la suppression</h3>
                        <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer ce partenaire ? Cette action est irréversible.</p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-6 py-2 rounded-lg border hover:bg-gray-100 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDelete}
                                className="bg-red-600 text-white px-6 py-2 rounded-lg shadow hover:bg-red-700 transition"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminPartners;
