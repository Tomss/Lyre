import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Upload, GripVertical, X, Image as ImageIcon, Layout, Palette } from 'lucide-react';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { API_URL } from '../config';

interface CarouselImage {
    id: string;
    image_url: string;
    title: string;
    subtitle: string;
    sort_order: number;
    is_active: number | boolean;
}

// Computes the sortable item styles
function SortableItem(props: { id: string; children: React.ReactNode }) {
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

const AdminTheme = () => {
    const { currentUser, token, isAuthenticated } = useAuth();
    const { settings, updateSettings, pageHeaders, updatePageHeader } = useTheme();
    const [activeTab, setActiveTab] = useState<'general' | 'carousel' | 'headers'>('general');
    const [headerUploading, setHeaderUploading] = useState<string | null>(null);

    // Page Headers Local State
    const [localPageHeaders, setLocalPageHeaders] = useState<Record<string, string>>({});
    const [headersSaving, setHeadersSaving] = useState(false);

    useEffect(() => {
        setLocalPageHeaders(pageHeaders);
    }, [pageHeaders]);

    const handleHeadersSave = async () => {
        setHeadersSaving(true);
        try {
            const promises = Object.entries(localPageHeaders).map(([slug, imageUrl]) => {
                return updatePageHeader(slug, imageUrl);
            });
            await Promise.all(promises);
            showCarouselNotification('En-têtes mis à jour avec succès');
        } catch (err) {
            console.error(err);
            showCarouselNotification('Erreur lors de la mise à jour', 'error');
        }
        setHeadersSaving(false);
    };



    // Carousel State
    const [images, setImages] = useState<CarouselImage[]>([]);
    const [loadingImages, setLoadingImages] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [carouselNotification, setCarouselNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Carousel Form State
    const [showCarouselForm, setShowCarouselForm] = useState(false);
    const [editingImage, setEditingImage] = useState<CarouselImage | null>(null);
    const [carouselFile, setCarouselFile] = useState<File | null>(null);
    const [carouselPreviewUrl, setCarouselPreviewUrl] = useState<string | null>(null);
    const [carouselFormData, setCarouselFormData] = useState({
        title: '',
        subtitle: '',
        sort_order: 0,
        is_active: true
    });
    const [carouselInterval, setCarouselInterval] = useState<number>(5); // Seconds

    // General Settings State
    const [generalForm, setGeneralForm] = useState({
        theme_primary_color: settings.theme_primary_color || '#0D9488',
        theme_secondary_color: settings.theme_secondary_color || '#0891B2'
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(settings.site_logo_url || null);
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsNotification, setSettingsNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Dnd Sensors
    // Dnd Sensors
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

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setImages((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleGlobalCarouselSave = async () => {
        setSavingSettings(true);
        try {
            // 1. Save Interval
            await updateSettings({ carousel_interval: (carouselInterval * 1000).toString() });

            // 2. Save Order
            if (images.length > 0) {
                await fetch(`${API_URL}/carousel/reorder`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ items: images.map(img => img.id) })
                });
            }

            showCarouselNotification('Configuration et ordre enregistrés !');
        } catch (error) {
            console.error('Erreur sauvegarde globale:', error);
            showCarouselNotification('Erreur lors de la sauvegarde globale', 'error');
        } finally {
            setSavingSettings(false);
        }
    };

    // --- CAROUSEL LOGIC ---
    const fetchImages = async () => {
        try {
            const response = await fetch(`${API_URL}/carousel/admin`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const normalized = data.map((img: any) => ({
                    ...img,
                    is_active: img.is_active === 1 || img.is_active === true
                }));
                // Ensure default sort by sort_order
                setImages(normalized);
            }
        } catch (error) {
            console.error('Erreur chargement images:', error);
        }
        setLoadingImages(false);
    };

    useEffect(() => {
        if (isAuthenticated && (currentUser?.role === "Admin" || currentUser?.managedModules?.includes("theme"))) {
            fetchImages();
        }
    }, [isAuthenticated, currentUser, token]);

    // Update local state when global settings change (e.g. initial load)
    useEffect(() => {
        setGeneralForm({
            theme_primary_color: settings.theme_primary_color,
            theme_secondary_color: settings.theme_secondary_color
        });
        setLogoPreviewUrl(settings.site_logo_url);
        if (settings.carousel_interval) {
            setCarouselInterval(parseInt(settings.carousel_interval) / 1000);
        }
    }, [settings]);

    const showCarouselNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setCarouselNotification({ message, type });
        setTimeout(() => setCarouselNotification(null), 3000);
    };

    const handleCarouselFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setCarouselFile(selectedFile);
            setCarouselPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };


    const handleCarouselEdit = (img: CarouselImage) => {
        setEditingImage(img);
        setCarouselFormData({
            title: img.title || '',
            subtitle: img.subtitle || '',
            sort_order: img.sort_order,
            is_active: !!img.is_active
        });
        setCarouselPreviewUrl(img.image_url);
        setCarouselFile(null);
        setShowCarouselForm(true);
    };

    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleCarouselDelete = (id: string) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            const response = await fetch(`${API_URL}/carousel/${deleteConfirmId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                showCarouselNotification('Image supprimée');
                fetchImages();
            } else {
                throw new Error('Erreur suppression');
            }
        } catch (error) {
            showCarouselNotification('Erreur lors de la suppression', 'error');
        } finally {
            setDeleteConfirmId(null);
        }
    };

    const handleCarouselSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            let imageUrl = editingImage?.image_url;
            if (carouselFile) {
                const uploadData = new FormData();
                uploadData.append('file', carouselFile);
                const uploadResponse = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: uploadData
                });
                if (!uploadResponse.ok) throw new Error('Erreur upload image');
                const uploadResult = await uploadResponse.json();
                imageUrl = uploadResult.filePath;
            }

            const body = {
                ...carouselFormData,
                image_url: imageUrl
            };

            const url = editingImage ? `${API_URL}/carousel/${editingImage.id}` : `${API_URL}/carousel`;
            const method = editingImage ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) throw new Error('Erreur sauvegarde');
            showCarouselNotification(editingImage ? 'Image modifiée' : 'Image ajoutée');
            closeCarouselForm();
            fetchImages();
        } catch (error: any) {
            showCarouselNotification(error.message || 'Erreur inconnue', 'error');
        } finally {
            setUploading(false);
        }
    };


    const closeCarouselForm = () => {
        setShowCarouselForm(false);
        setCarouselFile(null);
        setCarouselPreviewUrl(null);
        setEditingImage(null);
        setCarouselFormData({ title: '', subtitle: '', sort_order: 0, is_active: true });
    };


    // --- GENERAL SETTINGS LOGIC ---
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setLogoFile(selectedFile);
            setLogoPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleResetToDefault = () => {
        if (window.confirm('Voulez-vous vraiment rétablir les couleurs par défaut ?')) {
            setGeneralForm(prev => ({
                ...prev,
                theme_primary_color: '#0D9488', // Default Teal
                theme_secondary_color: '#1E293B', // Default Slate
            }));
        }
    };

    const handleSettingsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSettings(true);
        setSettingsNotification(null);

        try {
            let logoUrl = settings.site_logo_url;

            // Upload Logo if changed
            if (logoFile) {
                const uploadData = new FormData();
                uploadData.append('file', logoFile);

                // Reuse existing upload endpoint
                const uploadResponse = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: uploadData
                });
                if (!uploadResponse.ok) throw new Error('Erreur upload logo');
                const uploadResult = await uploadResponse.json();
                logoUrl = uploadResult.filePath;
            }

            const newSettings = {
                site_logo_url: logoUrl,
                theme_primary_color: generalForm.theme_primary_color,
                theme_secondary_color: generalForm.theme_secondary_color
            };

            await updateSettings(newSettings);
            setSettingsNotification({ message: 'Configuration sauvegardée !', type: 'success' });
        } catch (error) {
            setSettingsNotification({ message: 'Erreur lors de la sauvegarde.', type: 'error' });
        } finally {
                setSavingSettings(false);
        }
    };


    if (currentUser?.role !== 'Admin' && (!currentUser?.managedModules || !currentUser.managedModules.includes('theme'))) {
      return <Navigate to="/dashboard" />;
    }

    return (
        <div className="font-inter pt-20 lg:pt-40 pb-20 min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <Link to="/dashboard" className="text-slate-400 hover:text-indigo-600 transition flex items-center mb-2 group">
                            <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                            Retour au tableau de bord
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-800 font-poppins flex items-center">
                            <Palette className="mr-3 h-8 w-8 text-indigo-600" />
                            Gestion du Thème
                        </h1>
                        <p className="text-slate-500 mt-1">Personnalisez le logo, les couleurs et le carrousel.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="flex border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'general' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                            <Palette className="h-5 w-5 mr-2" />
                            Logo & Couleurs
                        </button>
                        <button
                            onClick={() => setActiveTab('carousel')}
                            className={`flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'carousel' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                            <Layout className="h-5 w-5 mr-2" />
                            Carrousel (Accueil)
                        </button>
                        <button
                            onClick={() => setActiveTab('headers')}
                            className={`flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'headers' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                            <ImageIcon className="h-5 w-5 mr-2" />
                            En-têtes de Pages
                        </button>
                    </div>

                    <div className="p-6 md:p-8">
                        {/* --- TAB: GENERAL --- */}
                        {activeTab === 'general' && (
                            <form onSubmit={handleSettingsSubmit} className="max-w-2xl">
                                {settingsNotification && (
                                    <div className={`mb-6 p-4 rounded-lg shadow-sm ${settingsNotification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                                        {settingsNotification.message}
                                    </div>
                                )}

                                <div className="space-y-8">
                                    {/* Logo Section */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Logo du Site</h3>
                                        <div className="flex items-center space-x-6">
                                            <div className="relative h-32 w-32 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 group">
                                                {logoPreviewUrl ? (
                                                    <>
                                                        <img src={logoPreviewUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Upload className="text-white h-8 w-8" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center p-4">
                                                        <ImageIcon className="h-8 w-8 text-slate-300 mx-auto mb-1" />
                                                        <span className="text-xs text-slate-400">Aucun logo</span>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoChange}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-700">Changer le logo</p>
                                                <p className="text-sm text-slate-500 mb-2">Cliquez sur l'aperçu pour uploader un nouveau fichier.</p>
                                                <p className="text-xs text-slate-400">Recommandé : PNG transparent, 200px de large.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Colors Section */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Couleurs du Thème</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <label className="block font-medium text-slate-700 mb-2">Couleur Principale</label>
                                                <div className="flex items-center space-x-3">
                                                    <input
                                                        type="color"
                                                        value={generalForm.theme_primary_color}
                                                        onChange={(e) => setGeneralForm({ ...generalForm, theme_primary_color: e.target.value })}
                                                        className="h-12 w-24 p-1 rounded border border-slate-300 cursor-pointer"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={generalForm.theme_primary_color}
                                                        onChange={(e) => setGeneralForm({ ...generalForm, theme_primary_color: e.target.value })}
                                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono uppercase"
                                                    />
                                                </div>
                                                <p className="text-sm text-slate-500 mt-2">Utilisée pour les boutons, liens et titres principaux.</p>
                                            </div>
                                            <div className="flex justify-end pt-2">
                                                <button
                                                    type="button"
                                                    onClick={handleResetToDefault}
                                                    className="text-sm text-slate-500 hover:text-teal-600 underline transition-colors"
                                                >
                                                    Rétablir les couleurs par défaut
                                                </button>
                                            </div>
                                            <div>
                                                <label className="block font-medium text-slate-700 mb-2">Couleur Secondaire</label>
                                                <div className="flex items-center space-x-3">
                                                    <input
                                                        type="color"
                                                        value={generalForm.theme_secondary_color}
                                                        onChange={(e) => setGeneralForm({ ...generalForm, theme_secondary_color: e.target.value })}
                                                        className="h-12 w-24 p-1 rounded border border-slate-300 cursor-pointer"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={generalForm.theme_secondary_color}
                                                        onChange={(e) => setGeneralForm({ ...generalForm, theme_secondary_color: e.target.value })}
                                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono uppercase"
                                                    />
                                                </div>
                                                <p className="text-sm text-slate-500 mt-2">Utilisée pour les gradients et accents.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={savingSettings}
                                            className="inline-flex items-center px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200 disabled:opacity-70"
                                        >
                                            {savingSettings ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                                            Enregistrer les modifications
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* --- TAB: CAROUSEL --- */}
                        {activeTab === 'carousel' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-slate-800">Images du Carrousel</h3>
                                    <button
                                        onClick={() => setShowCarouselForm(true)}
                                        className="inline-flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors shadow-sm text-sm"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Ajouter une image
                                    </button>
                                </div>

                                {carouselNotification && (
                                    <div className={`mb-4 p-4 rounded-lg shadow-sm ${carouselNotification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                                        {carouselNotification.message}
                                    </div>
                                )}

                                {/* Carousel Configuration Form */}
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
                                    <h4 className="font-semibold text-slate-800 mb-4">Configuration du Carrousel</h4>
                                    <div className="flex items-end gap-4">
                                        <div className="flex-grow max-w-xs">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Durée d'affichage (secondes)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="60"
                                                value={carouselInterval}
                                                onChange={(e) => setCarouselInterval(parseInt(e.target.value) || 5)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Définit le temps d'attente avant de passer à l'image suivante automatiquement.</p>
                                </div>

                                {/* Draggable List */}
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 max-h-[600px] overflow-y-auto">
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext
                                            items={images.map(img => img.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {loadingImages ? (
                                                <div className="text-center py-8">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
                                                    <p className="text-slate-500">Chargement...</p>
                                                </div>
                                            ) : images.length === 0 ? (
                                                <div className="text-center py-12 text-slate-500">
                                                    <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                                    <p>Aucune image dans le carrousel.</p>
                                                    <button onClick={() => setShowCarouselForm(true)} className="text-teal-600 hover:underline mt-2">
                                                        Ajouter la première image
                                                    </button>
                                                </div>
                                            ) : (
                                                images.map((img) => (
                                                    <SortableItem key={img.id} id={img.id}>
                                                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm mb-3 flex items-center gap-4 group hover:shadow-md transition-shadow cursor-default">
                                                            <div className="cursor-grab p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded hidden group-hover:block" title="Déplacer">
                                                                <GripVertical className="h-5 w-5" />
                                                            </div>
                                                            <div className="h-16 w-24 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                                                                <img src={img.image_url} alt={img.title} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div className="flex-grow min-w-0">
                                                                <h4 className="font-semibold text-slate-800 truncate">{img.title || 'Sans titre'}</h4>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="font-semibold text-slate-800">{img.title || 'Sans titre'}</span>
                                                                    {!img.is_active && <span className="bg-slate-200 text-slate-500 text-xs px-2 py-0.5 rounded-full">Désactivé</span>}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <button onClick={() => handleCarouselEdit(img)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                                                                    <Layout className="h-4 w-4" />
                                                                </button>
                                                                <button onClick={() => handleCarouselDelete(img.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                                                            </div>
                                                        </div>
                                                    </SortableItem>
                                                ))
                                            )}
                                        </SortableContext>
                                    </DndContext>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-200">
                                    <button
                                        onClick={handleGlobalCarouselSave}
                                        disabled={savingSettings}
                                        className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200 disabled:opacity-70 font-semibold"
                                    >
                                        {savingSettings ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                                        Enregistrer toute la configuration
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* --- TAB: HEADERS --- */}
                        {activeTab === 'headers' && (
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-6">En-têtes de Pages</h3>
                                <p className="text-slate-500 mb-8">Personnalisez les images d'en-tête pour les différentes sections du site.</p>

                                <div className="grid grid-cols-1 gap-6">
                                    {[
                                        { id: 'school', title: "L'École", desc: "Page de présentation de l'école et des professeurs." },
                                        { id: 'orchestres', title: "Nos Orchestres", desc: "Page dédiée aux ensembles et orchestres." },
                                        { id: 'events', title: "Événements", desc: "Calendrier et liste des événements." },
                                        { id: 'media', title: "Médias", desc: "Galeries photos et vidéos." },
                                        { id: 'contact', title: "Contact", desc: "Page de contact et formulaire." },
                                    ].map((page) => (
                                        <div key={page.id} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center gap-6">
                                            <div className="relative h-32 w-full md:w-48 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 group">
                                                {localPageHeaders[page.id] ? (
                                                    <>
                                                        <img src={localPageHeaders[page.id]} alt={page.title} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Upload className="text-white h-6 w-6" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-slate-400">
                                                        <span className="text-xs">Défaut</span>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    disabled={headerUploading === page.id}
                                                    onChange={async (e) => {
                                                        if (e.target.files?.[0]) {
                                                            const file = e.target.files[0];
                                                            setHeaderUploading(page.id);
                                                            try {
                                                                const formData = new FormData();
                                                                formData.append('file', file);
                                                                const res = await fetch(`${API_URL}/upload`, {
                                                                    method: 'POST',
                                                                    headers: { 'Authorization': `Bearer ${token}` },
                                                                    body: formData
                                                                });
                                                                if (res.ok) {
                                                                    const data = await res.json();
                                                                    // Update LOCAL state only
                                                                    setLocalPageHeaders(prev => ({
                                                                        ...prev,
                                                                        [page.id]: data.filePath
                                                                    }));
                                                                }
                                                            } catch (err) {
                                                                console.error(err);
                                                                showCarouselNotification('Erreur upload', 'error');
                                                            } finally {
                                                                setHeaderUploading(null);
                                                            }
                                                        }
                                                    }}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                {headerUploading === page.id && (
                                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-grow">
                                                <h4 className="font-bold text-slate-800 text-lg">{page.title}</h4>
                                                <p className="text-slate-500 text-sm">{page.desc}</p>
                                                <p className="text-xs text-slate-400 mt-2">{localPageHeaders[page.id] ? 'Image sélectionnée (non sauvegardée)' : (pageHeaders[page.id] ? 'Image actuelle' : 'Image par défaut')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-200">
                                    <button
                                        onClick={handleHeadersSave}
                                        disabled={headersSaving}
                                        className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200 disabled:opacity-70 font-semibold"
                                    >
                                        {headersSaving ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                                        Enregistrer les en-têtes
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Carousel Form Modal */}
            {
                showCarouselForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-xl font-bold text-slate-800">{editingImage ? 'Modifier l\'image' : 'Nouvelle image'}</h2>
                                <button onClick={closeCarouselForm} className="text-slate-400 hover:text-slate-600">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <form onSubmit={handleCarouselSubmit} className="p-6 space-y-4">
                                {/* Fields removed: Title and Subtitle are not used anymore */}
                                {false && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-700">Titre</label>
                                            <input
                                                type="text"
                                                value={carouselFormData.title}
                                                onChange={(e) => setCarouselFormData({ ...carouselFormData, title: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                                placeholder="Titre de la slide"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-700">Sous-titre (optionnel)</label>
                                            <input
                                                type="text"
                                                value={carouselFormData.subtitle}
                                                onChange={(e) => setCarouselFormData({ ...carouselFormData, subtitle: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                                placeholder="Description courte"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Custom File Input */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700">Image</label>
                                    <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCarouselFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                                        />
                                        {carouselPreviewUrl ? (
                                            <div className="relative h-40 w-full mx-auto rounded-lg overflow-hidden">
                                                <img src={carouselPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="space-y-2 py-4">
                                                <ImageIcon className="h-8 w-8 text-slate-400 mx-auto" />
                                                <p className="text-sm text-slate-500">Cliquez pour choisir une image</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={carouselFormData.is_active as boolean}
                                            onChange={(e) => setCarouselFormData({ ...carouselFormData, is_active: e.target.checked })}
                                            className="rounded text-teal-600 focus:ring-teal-500"
                                        />
                                        <span className="text-sm text-slate-700">Activer cette image</span>
                                    </label>
                                </div>

                                <div className="pt-4 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={closeCarouselForm}
                                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200 disabled:opacity-70 flex items-center"
                                    >
                                        {uploading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2" />}
                                        {editingImage ? 'Modifier' : 'Ajouter'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                deleteConfirmId && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up">
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="h-8 w-8 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Supprimer l'image ?</h3>
                                <p className="text-slate-500 mb-6">Cette action est irréversible. L'image sera retirée du carrousel immédiatement.</p>

                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={() => setDeleteConfirmId(null)}
                                        className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AdminTheme;
