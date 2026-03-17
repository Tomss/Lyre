import React, { useState, useEffect, FormEvent } from 'react';
import { Edit, Trash2, Plus, Search, X, CheckCircle, ArrowLeft, Newspaper } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

import { API_URL } from '../config';

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

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let imageUrl = null;

            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append('file', selectedFile);
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
            
            // If the user removed the image (previewUrl is null) and didn't select a new one
            if (!previewUrl && !selectedFile) {
                imageUrl = null;
            }

            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append('file', selectedFile);
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
        setPreviewUrl(news.image_url || null);
        setShowAddForm(true);
    };

    const cancelEdit = () => {
        setEditingNews(null);
        setShowAddForm(false);
        setFormData({ title: '', content: '', published_at: new Date().toISOString().split('T')[0] });
        setSelectedFile(null);
        setPreviewUrl(null);
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <Link to="/dashboard" className="text-slate-400 hover:text-indigo-600 transition flex items-center mb-2 group">
                            <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                            Retour au tableau de bord
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-800 font-poppins flex items-center">
                            <Newspaper className="mr-3 h-8 w-8 text-indigo-600" />
                            Gestion des Actualités
                        </h1>
                        <p className="text-slate-500 mt-1">Gérez les articles et annonces du site.</p>
                    </div>
                    <button onClick={() => { setEditingNews(null); setShowAddForm(true); }} className="flex items-center px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                        <Plus className="mr-2 h-5 w-5" />
                        Nouvelle Actualité
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="relative">
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Rechercher une actualité..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* News List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-slate-500">Chargement des actualités...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNews.map((news) => (
                            <div key={news.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                    {news.image_url ? (
                                        <img src={news.image_url} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-300">
                                            <Newspaper className="h-12 w-12" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-medium text-slate-700">
                                        {new Date(news.published_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-lg text-slate-800 mb-2 line-clamp-1">{news.title}</h3>
                                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">{news.content}</p>

                                    <div className="flex justify-end pt-3 border-t border-slate-100 gap-2">
                                        <button onClick={() => handleEdit(news)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => setDeleteConfirmation({ isOpen: true, news })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredNews.length === 0 && (
                            <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                                <Newspaper className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">Aucune actualité trouvée.</p>
                            </div>
                        )}
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
                            <form onSubmit={editingNews ? handleUpdate : handleCreate} className="flex-grow overflow-y-auto p-6 space-y-6">

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Titre</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Titre de l'article" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Date de publication</label>
                                        <input type="date" name="published_at" value={formData.published_at} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Image de couverture</label>
                                        <div className="relative">
                                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="news-image" />
                                            <label htmlFor="news-image" className="w-full flex items-center justify-center px-4 py-2 border border-slate-200 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-slate-500 text-sm">
                                                {selectedFile ? selectedFile.name : 'Choisir une image...'}
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {previewUrl && (
                                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group">
                                        <img src={previewUrl} alt="Aperçu" className="w-full h-full object-cover" />
                                        <button 
                                            type="button" 
                                            onClick={() => { setPreviewUrl(null); setSelectedFile(null); }} 
                                            className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                                            title="Supprimer l'image"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Contenu</label>
                                    <textarea name="content" value={formData.content} onChange={handleInputChange} placeholder="Rédigez votre article ici..." required className="w-full px-4 py-3 border border-slate-200 rounded-lg h-64 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"></textarea>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                                    <button type="button" onClick={cancelEdit} className="px-6 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors">Annuler</button>
                                    <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all font-medium disabled:opacity-70 disabled:cursor-not-allowed">
                                        {loading ? 'Enregistrement...' : (editingNews ? 'Mettre à jour' : 'Publier')}
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
