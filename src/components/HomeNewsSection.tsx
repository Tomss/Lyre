import React, { useState, useEffect, useRef } from 'react';
import { Newspaper, ArrowRight, CalendarDays, X } from 'lucide-react';

import { API_URL } from '../config';

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

    // Auto Scroll Logic
    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let animationFrameId: number;

        const scroll = () => {
            if (!isPaused && scrollContainer) {
                scrollContainer.scrollLeft += 1.0;

                // Reset to start when we reach the end
                if (scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth - 1) {
                    scrollContainer.scrollLeft = 0;
                }
            }
            animationFrameId = requestAnimationFrame(scroll);
        };

        animationFrameId = requestAnimationFrame(scroll);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isPaused, news]);

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
        <section id="news" className="py-24 bg-white relative overflow-hidden scroll-mt-20 group/section">
            {/* Modal Actualité */}
            {selectedNews && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200" onClick={(e) => e.stopPropagation()}>
                        {/* Header/Image */}
                        <div className="relative h-64 sm:h-80 bg-slate-100 flex-shrink-0">
                            {selectedNews.image_url ? (
                                <img src={selectedNews.image_url} alt={selectedNews.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-teal-50 text-teal-300">
                                    <Newspaper className="h-16 w-16 mb-4 opacity-50" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                            
                            {/* Bouton Fermeture */}
                            <button 
                                onClick={() => setSelectedNews(null)}
                                className="absolute top-4 right-4 w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full text-white flex items-center justify-center transition-colors border border-white/20"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            {/* Date Superposée */}
                            <div className="absolute bottom-6 left-6 flex items-center text-white/90 text-sm font-medium">
                                <CalendarDays className="w-4 h-4 mr-2 text-teal-400" />
                                {new Date(selectedNews.published_at).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                        </div>

                        {/* Contenu */}
                        <div className="p-8 sm:p-10">
                            <h2 className="font-poppins font-bold text-2xl sm:text-3xl text-slate-800 mb-6 leading-tight">
                                {selectedNews.title}
                            </h2>
                            <div className="prose prose-slate prose-teal max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
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
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Header Modal */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                            <div>
                                <h2 className="font-poppins font-bold text-2xl text-slate-800">Dernières Actualités</h2>
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
                                                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
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
                                            <h3 className="font-poppins font-bold text-sm sm:text-base text-slate-800 mb-1 group-hover:text-teal-700 transition-colors truncate">
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

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12 relative z-10">
                <div className="text-center">
                    <h2 className="font-poppins font-bold text-3xl md:text-5xl text-slate-900 mb-4">
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
                {/* Gradient Masks */}
                <div className="absolute inset-y-0 left-0 w-32 md:w-64 bg-gradient-to-r from-white via-white/90 to-transparent z-20 pointer-events-none"></div>
                <div className="absolute inset-y-0 right-0 w-32 md:w-64 bg-gradient-to-l from-white via-white/90 to-transparent z-20 pointer-events-none"></div>

                {/* Navigation Buttons */}
                <button
                    onClick={() => scrollManual('left')}
                    className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/90 backdrop-blur shadow-lg shadow-teal-900/10 border border-teal-100 text-teal-600 flex items-center justify-center hover:bg-teal-500 hover:text-white transition-all duration-300 opacity-0 group-hover/section:opacity-100 translate-x-4 group-hover/section:translate-x-0 cursor-pointer"
                    aria-label="Précédent"
                >
                    <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <button
                    onClick={() => scrollManual('right')}
                    className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/90 backdrop-blur shadow-lg shadow-teal-900/10 border border-teal-100 text-teal-600 flex items-center justify-center hover:bg-teal-500 hover:text-white transition-all duration-300 opacity-0 group-hover/section:opacity-100 -translate-x-4 group-hover/section:translate-x-0 cursor-pointer"
                    aria-label="Suivant"
                >
                    <ArrowRight className="w-5 h-5" />
                </button>

                {/* Scrollable Track - Added py-12 for shadows, increased gap */}
                <div
                    ref={scrollRef}
                    className={`flex gap-8 px-8 py-12 overflow-x-auto no-scrollbar select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    {news.map((item, index) => (
                        <div
                            key={`${item.id}-${index}`}
                            className="w-[350px] md:w-[400px] shrink-0 group relative h-[500px]" // Increased height
                        >
                            <div className="h-full bg-gradient-to-br from-teal-50/80 to-cyan-50/50 rounded-[2rem] shadow-lg shadow-teal-900/5 border border-teal-100/50 hover:border-teal-300/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-teal-100/60 overflow-hidden flex flex-col relative group">
                                {/* Border Gradient Trick */}
                                <div className="absolute inset-0 rounded-[2rem] p-[2px] bg-gradient-to-br from-teal-100 to-cyan-100/30 -z-10 opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>

                                {/* Click Overlay (avoids text selection/dragging issues) */}
                                <div 
                                    className="absolute inset-0 z-30 cursor-pointer" 
                                    onClick={() => {
                                        if (dragDistance < 10) setSelectedNews(item);
                                    }}
                                ></div>

                                {/* Image Section */}
                                <div className="h-[240px] relative overflow-hidden bg-teal-100/30">
                                    <div className="absolute inset-0 bg-gradient-to-t from-teal-900/60 via-teal-900/10 to-transparent opacity-60 group-hover:opacity-40 transition-opacity z-10"></div>
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt={item.title}
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000 pointer-events-none"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-teal-50/50 text-teal-300">
                                            <Newspaper className="h-16 w-16 mb-4 opacity-50" />
                                            <span className="text-xs font-bold uppercase tracking-widest opacity-70">Actualité</span>
                                        </div>
                                    )}

                                    {/* Date Badge */}
                                    <div className="absolute top-4 left-4 z-20">
                                        <div className="bg-white/95 backdrop-blur-md pr-4 pl-1 py-1 rounded-full flex items-center gap-3 shadow-lg shadow-teal-900/10 border border-white/60 group-hover:scale-105 transition-transform">
                                            <div className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-full w-10 h-10 flex flex-col items-center justify-center shadow-md shadow-teal-500/20">
                                                <span className="text-sm font-black leading-none">{new Date(item.published_at).getDate()}</span>
                                            </div>
                                            <span className="text-xs font-bold uppercase text-teal-800 tracking-wider">
                                                {new Date(item.published_at).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Section (Transparent background to let gradient show through) */}
                                <div className="p-8 flex flex-col flex-1 relative bg-transparent">
                                    <h3 className="font-poppins font-bold text-xl text-slate-800 mb-3 leading-tight group-hover:text-teal-700 transition-colors line-clamp-2">
                                        {item.title}
                                    </h3>

                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-6 font-medium">
                                        {item.content}
                                    </p>

                                    <div className="mt-auto flex items-center justify-between border-t border-teal-100 pt-4">
                                        <span className="text-xs font-bold text-teal-700 uppercase tracking-wide flex items-center">
                                            <CalendarDays className="w-4 h-4 mr-2 text-teal-600" />
                                            {new Date(item.published_at).toLocaleDateString('fr-FR', { year: 'numeric' })}
                                        </span>

                                        <button className="w-10 h-10 rounded-full bg-white border border-teal-100 flex items-center justify-center text-teal-600 group-hover:bg-gradient-to-r group-hover:from-teal-500 group-hover:to-cyan-500 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-teal-200">
                                            <ArrowRight className="w-5 h-5 transform group-hover:rotate-[-45deg] transition-transform duration-300" />
                                        </button>
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
                    className="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-teal-700 bg-teal-50 rounded-full border border-teal-200 hover:bg-teal-100 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-teal-100 cursor-pointer"
                >
                    Voir plus d'actualités
                    <ArrowRight className="ml-2 h-4 w-4" />
                </button>
            </div>
        </section>
    );
};

export default HomeNewsSection;
