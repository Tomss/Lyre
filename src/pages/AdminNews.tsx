import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, Search, X, CheckCircle, ArrowLeft, Newspaper, Type, Calendar, Image as ImageIcon, AlignLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

import { API_URL } from '../config';
import FileUploadPreview from '../components/FileUploadPreview';
import ExistingFilesPreview from '../components/ExistingFilesPreview';

interface NewsItem {
    id: string;
    title: string;
    content: string;
    image_url?: string;
    published_at: string;
}

interface DeleteConfirmation {
    isOpen: boolean;
    news: NewsItem | null;
}

interface Notification {
    show: boolean;
    message: string;
    type: 'success' | 'error';
}

const AdminNews = () => {
    const { currentUser, token, isAuthenticated } = useAuth();
    const [newsList, setNewsList] = useState<NewsItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingNews, setEditingNews] = useState<NewsItem | null>(null);

    const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
        isOpen: false,
        news: null,
    });

    const [notification, setNotification] = useState<Notification>({
        show: false,
        message: '',
        type: 'success',
    });

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        published_at: new Date().toISOString().split('T')[0],
    });

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [filesToRemove, setFilesToRemove] = useState<string[]>([]);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
    };

    const fetchNews = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/news`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erreur de chargement des actualités');
            const data = await response.json();
            setNewsList(data || []);
        } catch (err: any) {
            showNotification(err.message, 'error');
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isAuthenticated && (currentUser?.role === "Admin" || currentUser?.managedModules?.includes("news"))) {
            fetchNews();
        }
    }, [isAuthenticated, currentUser, token]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            // We only keep the last selected file since news only support 1 image
            setSelectedFiles([files[files.length - 1]]);
        }
    };

    const removeFile = () => setSelectedFiles([]);
    const removeExistingFile = () => setFilesToRemove([editingNews?.id || '']);

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let imageUrl = null;

            if (selectedFiles.length > 0) {
                const uploadData = new FormData();
                uploadData.append('file', selectedFiles[0]);
                const uploadResponse = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: uploadData
                });
                if (!uploadResponse.ok) throw new Error('Erreur upload image');
                const uploadResult = await uploadResponse.json();
                imageUrl = uploadResult.filePath;
            }

            const response = await fetch(`${API_URL}/news`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...formData, image_url: imageUrl }),
            });

            if (!response.ok) throw new Error('Erreur création actualité');

            showNotification('Actualité créée avec succès');
            cancelEdit();
            fetchNews();
        } catch (err: any) {
            showNotification(err.message, 'error');
        }
        setLoading(false);
    };

    const handleUpdate = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingNews) return;
        setLoading(true);
        try {
            let imageUrl: string | null | undefined = editingNews.image_url;
            
            // If the user removed the image and didn't select a new one
            if (filesToRemove.length > 0 && selectedFiles.length === 0) {
                imageUrl = null;
            }

            if (selectedFiles.length > 0) {
                const uploadData = new FormData();
                uploadData.append('file', selectedFiles[0]);
                const uploadResponse = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: uploadData
                });
                if (!uploadResponse.ok) throw new Error('Erreur upload image');
                const uploadResult = await uploadResponse.json();
                imageUrl = uploadResult.filePath;
            }

            const response = await fetch(`${API_URL}/news/${editingNews.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...formData, image_url: imageUrl }),
            });

            if (!response.ok) throw new Error('Erreur mise à jour actualité');

            showNotification('Actualité mise à jour');
            cancelEdit();
            fetchNews();
        } catch (err: any) {
            showNotification(err.message, 'error');
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!deleteConfirmation.news || !token) return;
        try {
            const response = await fetch(`${API_URL}/news/${deleteConfirmation.news.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Erreur suppression');

            showNotification('Actualité supprimée');
            fetchNews();
            setDeleteConfirmation({ isOpen: false, news: null });
        } catch (err: any) {
            showNotification(err.message, 'error');
        }
    };

    const handleEdit = (news: NewsItem) => {
        setEditingNews(news);
        setFormData({
            title: news.title,
            content: news.content,
            published_at: news.published_at ? new Date(news.published_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        });
        setFilesToRemove([]);
        setSelectedFiles([]);
        setShowAddForm(true);
    };

    const cancelEdit = () => {
        setEditingNews(null);
        setShowAddForm(false);
        setFormData({ title: '', content: '', published_at: new Date().toISOString().split('T')[0] });
        setSelectedFiles([]);
        setFilesToRemove([]);
    };

    const filteredNews = newsList.filter(news =>
        news.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isAuthenticated && currentUser?.role !== 'Admin' && (!currentUser?.managedModules || !currentUser.managedModules.includes('news'))) {
      return <Navigate to="/dashboard" />;
    }

    return (
        <div className="font-inter pt-8 lg:pt-12 pb-20 min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-8">
                    <Link to="/dashboard" className="text-slate-400 hover:text-indigo-600 transition flex items-center mb-2 group">
                        <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                        Retour au tableau de bord
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center">
                            <Newspaper className="mr-3 h-8 w-8 text-indigo-600" />
                            <h1 className="text-3xl font-bold text-slate-800 font-poppins">
                                Gestion des Actualités
                            </h1>
                        </div>
                        <button onClick={() => { setEditingNews(null); setShowAddForm(true); }} className="flex items-center px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 mt-4 md:mt-0">
                            <Plus className="mr-2 h-5 w-5" />
                            Ajouter une actualité
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <label htmlFor="search" className="block text-sm font-semibold text-slate-700 mb-2">Rechercher une actualité</label>
                        <div className="relative">
                            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                id="search"
                                placeholder="Rechercher par titre ou contenu..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* News List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-slate-500">Chargement des actualités...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="divide-y divide-slate-50">
                            {filteredNews.map((news) => (
                                <div key={news.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors group flex items-start sm:items-center gap-4">
                                    {/* Thumbnail */}
                                    <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/50">
                                        {news.image_url ? (
                                            <img src={news.image_url} alt={news.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-slate-300">
                                                <Newspaper className="h-8 w-8" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Info */}
                                    <div className="flex-grow min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                                            <h3 className="font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                                                {news.title}
                                            </h3>
                                            <span className="hidden sm:block text-slate-300">•</span>
                                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg flex items-center shadow-sm">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {new Date(news.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-slate-500 text-sm line-clamp-1 leading-relaxed">
                                            {news.content}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 sm:gap-2 sm:ml-4 flex-shrink-0">
                                        <button 
                                            onClick={() => handleEdit(news)} 
                                            className="p-2 sm:p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" 
                                            title="Modifier"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button 
                                            onClick={() => setDeleteConfirmation({ isOpen: true, news })} 
                                            className="p-2 sm:p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" 
                                            title="Supprimer"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {filteredNews.length === 0 && (
                                <div className="py-20 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Newspaper className="h-8 w-8 text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 font-medium italic">Aucune actualité trouvée.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Add/Edit Form Modal */}
                {showAddForm && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in">
                            <div className="flex justify-between items-center p-6 border-b border-slate-100">
                                <h2 className="text-2xl font-bold text-slate-800">{editingNews ? 'Modifier' : 'Nouvelle'} Actualité</h2>
                                <button onClick={cancelEdit} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"><X size={24} /></button>
                            </div>
                            <form onSubmit={editingNews ? handleUpdate : handleCreate} className="flex-grow overflow-y-auto p-0">
                                <div className="p-6 space-y-6">
                                    {/* Section 1: Informations Générales */}
                                    <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
                                        <div className="flex items-center text-indigo-600 font-semibold mb-2">
                                            <Type className="w-5 h-5 mr-2" />
                                            Informations Générales
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center">
                                                Titre de l'actualité <span className="text-rose-500 ml-1">*</span>
                                            </label>
                                            <input 
                                                type="text" 
                                                name="title" 
                                                value={formData.title} 
                                                onChange={handleInputChange} 
                                                placeholder="Donnez un titre percutant..." 
                                                required 
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center">
                                                    <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
                                                    Date de publication
                                                </label>
                                                <input 
                                                    type="date" 
                                                    name="published_at" 
                                                    value={formData.published_at} 
                                                    onChange={handleInputChange} 
                                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center">
                                                    <ImageIcon className="w-4 h-4 mr-1.5 text-slate-400" />
                                                    Image de couverture
                                                </label>
                                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 transition-colors group cursor-pointer relative bg-slate-50/50">
                                                        <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-sm">
                                                                <Plus size={20} />
                                                            </div>
                                                            <p className="text-xs font-semibold text-slate-700">Cliquez ou glissez votre photo ici</p>
                                                            <p className="text-[10px] text-slate-500 mt-0.5">Format JPG, PNG ou WebP</p>
                                                        </div>
                                                    </div>

                                                    {selectedFiles.length > 0 && (
                                                        <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                                                            <FileUploadPreview files={selectedFiles} onRemove={removeFile} />
                                                        </div>
                                                    )}

                                                    {editingNews && editingNews.image_url && filesToRemove.length === 0 && (
                                                        <div className="pt-2">
                                                            <ExistingFilesPreview 
                                                                files={[{
                                                                    id: editingNews.id,
                                                                    file_name: "Image actuelle",
                                                                    file_path: editingNews.image_url,
                                                                    file_type: 'image',
                                                                    alt_text: editingNews.title,
                                                                    sort_order: 0
                                                                }]} 
                                                                onRemove={removeExistingFile} 
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Contenu */}
                                    <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
                                        <div className="flex items-center text-indigo-600 font-semibold mb-2">
                                            <AlignLeft className="w-5 h-5 mr-2" />
                                            Corps de l'article
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                Rédigez votre contenu <span className="text-rose-500 ml-1">*</span>
                                            </label>
                                            <textarea 
                                                name="content" 
                                                value={formData.content} 
                                                onChange={handleInputChange} 
                                                placeholder="Partagez les dernières nouvelles..." 
                                                required 
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl h-56 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end p-6 border-t border-slate-100 gap-3 bg-white rounded-b-2xl sticky bottom-0">
                                    <button type="button" onClick={cancelEdit} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-all">
                                        Annuler
                                    </button>
                                    <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold disabled:opacity-70 disabled:cursor-not-allowed">
                                        {loading ? 'Enregistrement...' : (editingNews ? 'Mettre à jour' : 'Publier l\'article')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {deleteConfirmation.isOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 z-50 flex justify-center items-center backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full animate-scale-in">
                            <h3 className="text-xl font-bold text-slate-800 mb-3">Supprimer l'article ?</h3>
                            <p className="text-slate-500 mb-6">Êtes-vous sûr de vouloir supprimer "{deleteConfirmation.news?.title}" ? Cette action est irréversible.</p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setDeleteConfirmation({ isOpen: false, news: null })} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors">Annuler</button>
                                <button onClick={handleDelete} className="bg-red-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all font-medium">Supprimer</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toast */}
                {notification.show && (
                    <div className={`fixed top-24 right-5 px-6 py-4 rounded-xl shadow-2xl z-[100] text-white font-medium flex items-center animate-fade-in-down ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        {notification.message}
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminNews;
