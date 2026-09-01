import React, { useState, useEffect } from 'react';
import { Newspaper, ArrowLeft, CalendarDays, ExternalLink, X, ZoomIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero';
import { useTheme } from '../context/ThemeContext';
import { getOptimizedImageUrl, getImageSrcSet } from '../utils/image';
import { useSEO } from '../utils/seo';

import { API_URL, BASE_URL } from '../config';

interface NewsItem {
    id: string;
    title: string;
    content: string;
    image_url: string;
    published_at: string;
}

const NewsArchive = () => {
    useSEO({
        title: "Actualités & Événements",
        description: "Toutes les actualités, concerts, projets et événements de l'école de musique et orchestre d'harmonie La Lyre à Chalindrey.",
        url: '/toutes-les-actualites'
    });
    const { pageHeaders } = useTheme();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedNews(null);
        };
        if (selectedNews) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedNews]);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch(`${API_URL}/news`);
                if (response.ok) {
                    const data = await response.json();
                    setNews(data.sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()));
                }
            } catch (error) {
                console.error('Error fetching news:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Modal Détail Actualité */}
            {selectedNews && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-[95vw] sm:max-w-[85vw] lg:max-w-5xl w-fit max-h-[92vh] overflow-y-auto border border-slate-200 relative mb-4 mt-4" onClick={(e) => e.stopPropagation()}>
                        {/* Header/Image */}
                        <div className="relative bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
                            {selectedNews.image_url ? (
                                <img 
                                    src={getOptimizedImageUrl(selectedNews.image_url, 1600, 85)} 
                                    alt={selectedNews.title} 
                                    className="w-auto max-w-full h-auto max-h-[80vh] block relative z-0 object-contain" 
                                />
                            ) : (
                                <div className="w-full h-64 flex flex-col items-center justify-center bg-teal-50 text-teal-300">
                                    <Newspaper className="h-16 w-16 mb-4 opacity-50" />
                                </div>
                            )}
                            
                            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none z-10"></div>
                            
                            <button 
                                onClick={() => setSelectedNews(null)}
                                className="absolute top-4 right-4 w-10 h-10 bg-black/40 hover:bg-black/70 backdrop-blur-md rounded-full text-white flex items-center justify-center transition-all z-20 border border-white/20 hover:scale-110"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            <div className="absolute bottom-4 left-4 flex items-center text-white/90 text-xs font-semibold z-20 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                                <CalendarDays className="w-3.5 h-3.5 mr-2 text-teal-400" />
                                {new Date(selectedNews.published_at).toLocaleDateString('fr-FR', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </div>
                        </div>

                        {/* Contenu */}
                        <div className="p-6 sm:p-8">
                            <h2 className="font-bold text-xl sm:text-2xl text-slate-800 mb-4 leading-tight">
                                {selectedNews.title}
                            </h2>
                            <div className="prose prose-slate prose-teal max-w-none text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                                {selectedNews.content}
                            </div>
                        </div>
                    </div>
                    {/* Overlay Click to Close */}
                    <div className="absolute inset-0 -z-10" onClick={() => setSelectedNews(null)}></div>
                </div>
            )}

            <PageHero
                title={<span>Toutes les <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-500">Actualités</span></span>}
                subtitle="Retrouvez l'intégralité des articles et des annonces de La Lyre."
                backgroundImage={pageHeaders['school'] || "/school-banner.webp"}
                anchors={[]}
            />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <Link to="/" className="inline-flex items-center text-slate-500 hover:text-emerald-600 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour à l'accueil
                </Link>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {news.map((item) => (
                            <div 
                                key={item.id} 
                                onClick={() => setSelectedNews(item)}
                                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg hover:border-teal-300 transition-all duration-300 flex flex-col group cursor-pointer"
                            >
                                <div className="aspect-[16/10] relative overflow-hidden bg-slate-100 flex-shrink-0">
                                    {item.image_url ? (
                                        <img 
                                            src={getOptimizedImageUrl(item.image_url, 700, 80)} 
                                            srcSet={getImageSrcSet(item.image_url)}
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            alt={item.title} 
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-300">
                                            <Newspaper className="h-10 w-10" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm border border-slate-100">
                                        {new Date(item.published_at).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="font-bold text-lg text-slate-900 mb-3 group-hover:text-teal-600 transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-grow leading-relaxed">
                                        {item.content}
                                    </p>
                                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-teal-600">
                                        <span>Lire la suite</span>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsArchive;
