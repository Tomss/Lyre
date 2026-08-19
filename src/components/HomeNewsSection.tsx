import React, { useState, useEffect, useRef } from 'react';
import { Newspaper, ArrowRight, CalendarDays, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_URL, BASE_URL } from '../config';

interface NewsItem {
    id: string;
    title: string;
    content: string;
    image_url: string;
    published_at: string;
}

const HomeNewsSection = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [allNews, setAllNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
    const [isAllNewsModalOpen, setIsAllNewsModalOpen] = useState(false);
    const [dragDistance, setDragDistance] = useState(0);

    // Mouse Drag events
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        setIsDragging(true);
        setIsPaused(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
        setDragDistance(0);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
        setIsPaused(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        setDragDistance(Math.abs(walk));
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch(`${API_URL}/news`);
                if (response.ok) {
                    const data = await response.json();
                    const sortedNews = data.sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
                    const top10News = sortedNews.slice(0, 10);
                    const top50News = sortedNews.slice(0, 50);

                    if (top10News.length > 0) {
                        setNews(top10News);
                        setAllNews(top50News);
                    } else {
                        setNews([]);
                        setAllNews([]);
                    }
                }
            } catch (error) {
                console.error('Error fetching news:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isAllNewsModalOpen || selectedNews) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isAllNewsModalOpen, selectedNews]);

    // Option 1: Discrete auto-advance every 6s (pauses on mouse hover/drag)
    useEffect(() => {
        if (isPaused || news.length <= 1) return;

        const interval = setInterval(() => {
            if (scrollRef.current) {
                const container = scrollRef.current;
                const cardWidth = 360;
                const maxScrollLeft = container.scrollWidth - container.clientWidth;

                if (container.scrollLeft >= maxScrollLeft - 10) {
                    container.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    container.scrollTo({ left: container.scrollLeft + cardWidth, behavior: 'smooth' });
                }
            }
        }, 6000);

        return () => clearInterval(interval);
    }, [isPaused, news]);

    const scrollManual = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const container = scrollRef.current;
            const cardWidth = 360;
            const targetScroll = container.scrollLeft + (direction === 'right' ? cardWidth : -cardWidth);
            container.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }
    };

    if (loading) return null;

    return (
        <section id="actualites" className="py-20 bg-slate-50 relative scroll-mt-20 overflow-hidden text-slate-900 border-t border-slate-200">
            
            {/* Modal Détails Article */}
            {selectedNews && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-100 overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
                        <div className="relative h-64 sm:h-80 bg-slate-900 flex-shrink-0">
                            {selectedNews.image_url ? (
                                <img 
                                    src={selectedNews.image_url.startsWith('http') ? selectedNews.image_url : `${BASE_URL}${selectedNews.image_url}`} 
                                    alt={selectedNews.title} 
                                    className="w-full h-full object-cover" 
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-slate-900 flex items-center justify-center">
                                    <Newspaper className="w-16 h-16 text-indigo-400/40" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />

                            <button 
                                onClick={() => setSelectedNews(null)}
                                className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/40 hover:bg-black/70 rounded-full text-white flex items-center justify-center transition-all border border-white/20"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="absolute bottom-6 left-6 right-6">
                                <span className="px-3 py-1 bg-indigo-600 text-white text-[11px] font-bold rounded-full uppercase tracking-wider mb-2 inline-block shadow-sm">
                                    Actualité
                                </span>
                                <h2 className="font-extrabold text-2xl sm:text-3xl text-white drop-shadow-md leading-tight">
                                    {selectedNews.title}
                                </h2>
                            </div>
                        </div>

                        <div className="p-8 sm:p-10 overflow-y-auto">
                            <div className="flex items-center text-xs font-semibold text-slate-400 mb-6 gap-2">
                                <CalendarDays className="w-4 h-4 text-indigo-600" />
                                <span>Publié le {new Date(selectedNews.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>

                            <div className="prose prose-slate prose-indigo max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                                {selectedNews.content}
                            </div>
                        </div>
                    </div>
                    <div className="absolute inset-0 -z-10" onClick={() => setSelectedNews(null)}></div>
                </div>
            )}

            {/* Modal "Toutes les Actualités" */}
            {isAllNewsModalOpen && !selectedNews && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                            <div>
                                <h2 className="font-bold text-2xl text-slate-900">Toutes les Actualités</h2>
                                <p className="text-indigo-600 text-xs mt-0.5">Retrouvez toutes les publications de La Lyre</p>
                            </div>
                            <button 
                                onClick={() => setIsAllNewsModalOpen(false)}
                                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-4">
                            {allNews.map((article) => (
                                <div 
                                    key={article.id}
                                    onClick={() => setSelectedNews(article)}
                                    className="p-5 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border border-slate-200 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                                >
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">{article.title}</h3>
                                        <p className="text-xs text-slate-400 flex items-center gap-2">
                                            <CalendarDays size={12} className="text-indigo-500" />
                                            <span>Publié le {new Date(article.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold text-indigo-600 flex items-center group-hover:translate-x-1 transition-transform">
                                        Lire <ArrowRight size={14} className="ml-1" />
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="absolute inset-0 -z-10" onClick={() => setIsAllNewsModalOpen(false)}></div>
                </div>
            )}

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Newspaper className="w-8 h-8 text-indigo-600" />
                            <h2 className="font-extrabold text-3xl md:text-4xl text-slate-900 tracking-tight">
                                Actualités & Vie de l'Association
                            </h2>
                        </div>
                        <p className="text-slate-500 text-sm font-light">
                            Les dernières nouvelles et annonces de La Lyre
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsAllNewsModalOpen(true)}
                            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-2 shadow-xs"
                        >
                            <span>Toutes les actus</span>
                            <ArrowRight size={14} />
                        </button>

                        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                            <button
                                onClick={() => scrollManual('left')}
                                className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                                aria-label="Précédent"
                                title="Actualité précédente"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => scrollManual('right')}
                                className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                                aria-label="Suivant"
                                title="Actualité suivante"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Snap Carousel Container */}
            <div
                className="relative w-full"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={handleMouseLeave}
            >
                {news.length > 0 ? (
                    <div
                        ref={scrollRef}
                        className={`flex gap-6 px-4 sm:px-8 py-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
                        {news.map((item) => (
                            <div 
                                key={item.id} 
                                className="snap-start shrink-0 w-[300px] sm:w-[350px] group relative h-[400px]"
                            >
                                <div className="h-full bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl hover:border-indigo-200 transition-all duration-300 overflow-hidden flex flex-col relative group">
                                    <div 
                                        className="absolute inset-0 z-30 cursor-pointer" 
                                        onClick={() => {
                                            if (dragDistance < 10) setSelectedNews(item);
                                        }}
                                    ></div>

                                    {/* Image / Header */}
                                    <div className="h-[180px] relative overflow-hidden bg-slate-100 flex-shrink-0">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url.startsWith('http') ? item.image_url : `${BASE_URL}${item.image_url}`}
                                                alt={item.title}
                                                loading="lazy"
                                                decoding="async"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-slate-200 flex items-center justify-center">
                                                <Newspaper className="w-12 h-12 text-indigo-400/40" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-6 flex-1 flex flex-col justify-between relative z-20">
                                        <div>
                                            <div className="flex items-center text-xs font-semibold text-slate-400 mb-2 gap-1.5">
                                                <CalendarDays size={13} className="text-indigo-500" />
                                                <span>{new Date(item.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            </div>

                                            <h3 className="font-bold text-base text-slate-900 mb-2 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                                                {item.title}
                                            </h3>

                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                {item.content}
                                            </p>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-xs font-bold text-indigo-600 flex items-center group-hover:translate-x-1 transition-transform">
                                                Lire l'article <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400 text-sm">
                        Aucune actualité publiée pour le moment.
                    </div>
                )}
            </div>
        </section>
    );
};

export default HomeNewsSection;
