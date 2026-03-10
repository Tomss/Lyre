import React, { useState, useEffect } from 'react';
import { Newspaper, ArrowLeft, CalendarDays, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero';
import { useTheme } from '../context/ThemeContext';

import { API_URL } from '../config';

interface NewsItem {
    id: string;
    title: string;
    content: string;
    image_url: string;
    published_at: string;
}

const NewsArchive = () => {
    const { pageHeaders } = useTheme();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

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
        <div className="font-inter bg-slate-50 min-h-screen">
            <PageHero
                title={<span>Toutes les <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-500">Actualités</span></span>}
                subtitle="Retrouvez l'intégralité des articles et des annonces de La Lyre."
                backgroundImage={pageHeaders['school'] || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1920"}
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
                            <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 flex flex-col group">
                                <div className="h-48 relative overflow-hidden bg-slate-100">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-300">
                                            <Newspaper className="h-10 w-10" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded text-xs font-bold text-slate-700 shadow-sm">
                                        {new Date(item.published_at).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="font-poppins font-bold text-lg text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-grow">
                                        {item.content}
                                    </p>
                                    <div className="mt-auto pt-4 border-t border-slate-50">
                                        {/* Usually link to a full article page if this were a blog, but user deleted Actualites page. 
                                            We'll keep it simple for now as a gallery. */}
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
