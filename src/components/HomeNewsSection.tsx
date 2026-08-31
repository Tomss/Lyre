import React, { useState, useEffect, useRef } from 'react';
import { Newspaper, ArrowRight, CalendarDays, X } from 'lucide-react';

import { API_URL, BASE_URL } from '../config';
import { getOptimizedImageUrl, getImageSrcSet } from '../utils/image';

interface NewsItem {
    id: string;
    title: string;
    content: string;
    image_url: string;
    published_at: string;
}

const HomeNewsSection = React.memo(() => {
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
        const walk = (x - startX) * 2; // Scroll sensitivity
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

    // Prevent body scroll when either modal is open
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

    const scrollManual = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 450;
            const targetScroll = scrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
            scrollRef.current.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }
    };

    if (loading) return null;
    if (news.length === 0) return null;

    return (
        <section id="actualites" className="py-24 bg-white relative overflow-hidden scroll-mt-20 group/section">
            {/* Modal Actualité */}
            {selectedNews && (
                <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
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
                            
                            {/* Overlay Gradient pour la lisibilité du texte en bas */}
                            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none z-10"></div>
                            
                            {/* Bouton Fermeture fixé en haut à droite de l'image ou du modal */}
                            <button 
                                onClick={() => setSelectedNews(null)}
                                className="absolute top-4 right-4 w-10 h-10 bg-slate-900/80 hover:bg-slate-900 rounded-full text-white flex items-center justify-center transition-all z-20 border border-white/20 hover:scale-110"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            {/* Date Superposée - Plus discrète */}
                            <div className="absolute bottom-4 left-4 flex items-center text-white/90 text-xs font-semibold z-20 bg-slate-900/80 px-3 py-1.5 rounded-full border border-white/10">
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

            {/* Modal "Toutes les Actualités" (50 dernières) */}
            {isAllNewsModalOpen && !selectedNews && (
                <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Header Modal */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                            <div>
                                <h2 className="font-bold text-2xl text-slate-800">Dernières Actualités</h2>
                                <p className="text-slate-500 text-sm">Les 50 dernières publications</p>
                            </div>
                            <button 
                                onClick={() => setIsAllNewsModalOpen(false)}
                                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Liste au scroll */}
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50">
                            <div className="flex flex-col space-y-3">
                                {allNews.map((item) => (
                                    <div 
                                        key={item.id}
                                        onClick={() => setSelectedNews(item)}
                                        className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-teal-300 transition-all cursor-pointer flex items-center p-3 group overflow-hidden"
                                    >
                                        <div className="w-24 h-24 sm:w-32 sm:h-24 flex-shrink-0 bg-slate-100 relative rounded-lg overflow-hidden mr-4">
                                            {item.image_url ? (
                                                <img src={item.image_url.startsWith('http') ? item.image_url : `${BASE_URL}${item.image_url}`} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-teal-300 bg-teal-50">
                                                    <Newspaper className="w-6 h-6 opacity-50 mb-1" />
                                                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-50">Actu</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <div className="flex items-center text-[10px] sm:text-xs font-bold text-teal-600 mb-1">
                                                <CalendarDays className="w-3 h-3 mr-1" />
                                                {new Date(item.published_at).toLocaleDateString('fr-FR')}
                                            </div>
                                            <h3 className="font-bold text-sm sm:text-base text-slate-800 mb-1 group-hover:text-teal-700 transition-colors truncate">
                                                {item.title}
                                            </h3>
                                            <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed hidden sm:block">
                                                {item.content}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Overlay Click to Close */}
                    <div className="absolute inset-0 -z-10" onClick={() => setIsAllNewsModalOpen(false)}></div>
                </div>
            )}

            {/* Background Accents - Teal/Blue Theme */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-50"></div>

            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mb-12 relative z-10">
                <div className="text-center">
                    <h2 className="font-bold text-3xl md:text-5xl text-slate-900 mb-4">
                        Nos Actualités
                    </h2>
                    <div className="h-1 w-24 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full mx-auto shadow-sm shadow-teal-100"></div>
                </div>
            </div>

            {/* Slider Container - Removed py-10 here to move it to track for shadow visibility */}
            <div
                className="relative w-full"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={handleMouseLeave}
            >
                {/* Navigation Buttons (Floating with 100% Click Priority via z-50 & stopPropagation) */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        scrollManual('left');
                    }}
                    className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white shadow-xl border border-teal-100 text-teal-600 flex items-center justify-center hover:bg-teal-500 hover:text-white transition-all duration-200 cursor-pointer"
                    aria-label="Précédent"
                    title="Précédent"
                >
                    <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        scrollManual('right');
                    }}
                    className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white shadow-xl border border-teal-100 text-teal-600 flex items-center justify-center hover:bg-teal-500 hover:text-white transition-all duration-200 cursor-pointer"
                    aria-label="Suivant"
                    title="Suivant"
                >
                    <ArrowRight className="w-5 h-5" />
                </button>

                {/* Scrollable Track - px-20 md:px-24 ensures 1st and last cards don't overlap arrows in initial/end states */}
                <div
                    ref={scrollRef}
                    className={`flex gap-8 px-20 md:px-24 py-12 overflow-x-auto no-scrollbar select-none overscroll-x-contain touch-pan-y ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    {news.map((item) => (
                        <div
                            key={item.id}
                            className="w-[300px] md:w-[350px] shrink-0 h-[450px]"
                        >
                            <div className="h-full bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-teal-400 transition-all duration-200 overflow-hidden flex flex-col relative group">
                                {/* Click Overlay */}
                                <div 
                                    className="absolute inset-0 z-30 cursor-pointer" 
                                    onClick={() => {
                                        if (dragDistance < 10) setSelectedNews(item);
                                    }}
                                ></div>

                                {/* Image Section */}
                                <div className="aspect-[16/10] relative overflow-hidden bg-slate-100 flex-shrink-0">
                                    {item.image_url ? (
                                        <img
                                            src={getOptimizedImageUrl(item.image_url, 700, 80)}
                                            srcSet={getImageSrcSet(item.image_url)}
                                            sizes="(max-width: 640px) 300px, 350px"
                                            alt={item.title}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-teal-50 text-teal-300">
                                            <Newspaper className="h-16 w-16 mb-4 opacity-50" />
                                            <span className="text-xs font-bold uppercase tracking-widest opacity-70">Actualité</span>
                                        </div>
                                    )}

                                    {/* Date Badge */}
                                    <div className="absolute top-4 left-4 z-20">
                                        <div className="bg-white/95 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-md border border-slate-100">
                                            <span className="text-sm font-black text-teal-600 leading-none">{new Date(item.published_at).getDate()}</span>
                                            <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                                                {new Date(item.published_at).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-6 flex flex-col flex-1 bg-white">
                                    <h3 className="font-bold text-lg text-slate-900 mb-2 leading-snug group-hover:text-teal-600 transition-colors line-clamp-2">
                                        {item.title}
                                    </h3>

                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-4 font-normal">
                                        {item.content}
                                    </p>

                                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                                        <span className="text-xs font-bold text-teal-700 uppercase tracking-wide flex items-center">
                                            <CalendarDays className="w-4 h-4 mr-2 text-teal-600" />
                                            {new Date(item.published_at).toLocaleDateString('fr-FR', { year: 'numeric' })}
                                        </span>

                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="text-center mt-4">
                <button 
                    onClick={() => setIsAllNewsModalOpen(true)}
                    className="inline-flex items-center justify-center space-x-3 bg-slate-900 text-white font-bold py-4 px-10 rounded-2xl hover:bg-teal-600 transition-all duration-300 hover:shadow-xl hover:shadow-teal-900/20 group cursor-pointer"
                >
                    <span>Voir plus d'actualités</span>
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </section>
    );
});

export default HomeNewsSection;
