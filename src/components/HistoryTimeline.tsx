import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, X, ZoomIn } from 'lucide-react';
import { API_URL, BASE_URL } from '../config';
import { getOptimizedImageUrl, getImageSrcSet } from '../utils/image';

type HistoryEra = 'vintage' | 'retro' | 'classic' | 'modern';

export interface HistoryEvent {
    id: string;
    year: string;
    title: string;
    content: string;
    era: HistoryEra;
    icon?: string;
    image_url?: string;
    sort_order: number;
}



const TimelineCard = ({ item }: { item: HistoryEvent }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const content = item.content || '';
    const shouldTruncate = content.length > 200;

    // Dynamic Styles based on Era
    let cardStyle = "";
    let dateStyle = "";
    let buttonStyle = "";

    switch (item.era || 'classic') {
        case 'vintage':
            cardStyle = "bg-[#f4e4bc] border-2 border-[#8b5a2b] shadow-[4px_4px_0px_0px_rgba(139,90,43,0.3)] font-serif text-[#5c3a1e]";
            dateStyle = "text-[#8b5a2b] font-bold font-serif tracking-widest border-b-2 border-[#8b5a2b] inline-block mb-2";
            buttonStyle = "text-[#8b5a2b] hover:text-[#5c3a1e] font-serif";
            break;
        case 'retro':
            cardStyle = "bg-slate-100 border-2 border-slate-800 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] grayscale font-mono text-slate-800";
            dateStyle = "bg-slate-800 text-white px-2 py-1 font-mono text-sm inline-block mb-3";
            buttonStyle = "text-slate-800 hover:text-black font-mono";
            break;
        case 'classic':
            cardStyle = "bg-white border-t-4 border-indigo-600 shadow-xl font-sans text-slate-700";
            dateStyle = "text-indigo-600 font-bold text-lg mb-2 block uppercase tracking-wide";
            buttonStyle = "text-indigo-600 hover:text-indigo-800 font-semibold";
            break;
        case 'modern':
            cardStyle = "bg-white border border-teal-100 shadow-xl shadow-teal-500/10 rounded-2xl text-slate-600";
            dateStyle = "text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-600 font-bold text-xl mb-2 inline-block";
            buttonStyle = "text-teal-600 hover:text-teal-800 font-medium";
            break;
        default:
            cardStyle = "bg-white border-t-4 border-indigo-600 shadow-xl font-sans text-slate-700";
            dateStyle = "text-indigo-600 font-bold text-lg mb-2 block uppercase tracking-wide";
            buttonStyle = "text-indigo-600 hover:text-indigo-800 font-semibold";
    }

    const displayText = isExpanded ? content : content.slice(0, 200) + (shouldTruncate ? "..." : "");

    return (
        <div className={`p-5 md:p-6 relative ${cardStyle} transition-shadow duration-300 hover:shadow-2xl`}>
            <div className={`md:hidden ${dateStyle}`}>{item.year}</div>
            <h3 className={`text-2xl font-bold mb-4 ${item.era === 'vintage' ? 'font-serif' : ''}`}>
                {item.title}
            </h3>

            <div className={`leading-relaxed text-sm md:text-base opacity-90 whitespace-pre-wrap relative`}>
                {displayText}
                {!isExpanded && shouldTruncate && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/0 to-transparent pointer-events-none" />
                )}
            </div>

            {shouldTruncate && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`mt-4 flex items-center gap-1 text-sm ${buttonStyle} focus:outline-none transition-colors`}
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="w-4 h-4" />
                            Réduire
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-4 h-4" />
                            Lire la suite
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

const HistoryTimeline = () => {
    const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setPreviewPhoto(null);
        };
        if (previewPhoto) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [previewPhoto]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch(`${API_URL}/history`);
                if (response.ok) {
                    const data = await response.json();
                    setHistoryEvents(data);
                }
            } catch (error) {
                console.error("Failed to fetch history:", error);
            } finally {
                setLoading(false);
                setTimeout(() => {
                    if ((window as any).__lenis) {
                        (window as any).__lenis.resize();
                    }
                }, 100);
            }
        };
        fetchHistory();
    }, []);

    return (
        <section className="py-12 bg-white relative">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h2 className="font-bold text-3xl md:text-5xl text-slate-800 mb-4">Notre Histoire</h2>
                    <p className="text-slate-600 max-w-2xl mx-auto">De la "Cécilienne" à La Lyre d'aujourd'hui, voyagez à travers plus d'un siècle de passion musicale.</p>
                </div>

                <div className="relative">
                    {/* Central Line */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-px border-l-2 border-dashed border-slate-300 hidden md:block" />

                    <div className="space-y-8 md:space-y-12">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
                                <p className="text-slate-500">Chargement de l'histoire...</p>
                            </div>
                        ) : historyEvents.map((item, index) => {
                            const isEven = index % 2 === 0;
                            let badgeStyle = "";

                            switch (item.era) {
                                case 'vintage':
                                    badgeStyle = "bg-[#f9f5eb] text-[#8b5a2b] border-2 border-[#8b5a2b] font-serif tracking-wider";
                                    break;
                                case 'retro':
                                    badgeStyle = "bg-slate-800 text-white border-2 border-slate-600 font-mono";
                                    break;
                                case 'classic':
                                    badgeStyle = "bg-indigo-600 text-white border-2 border-indigo-400 font-sans tracking-wide";
                                    break;
                                case 'modern':
                                    badgeStyle = "bg-white text-teal-600 border-2 border-teal-500 font-bold shadow-[0_0_15px_rgba(20,184,166,0.3)]";
                                    break;
                            }

                            return (
                                <div key={index} className={`relative flex flex-col md:flex-row items-center ${isEven ? 'md:flex-row-reverse' : ''}`}>

                                    {/* Timeline Date Badge (Desktop) */}
                                    <div className={`absolute left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full flex items-center justify-center z-10 hidden md:flex whitespace-nowrap shadow-md ${badgeStyle}`}>
                                        <span className="text-sm font-bold">{item.year}</span>
                                    </div>

                                    {/* Image or Spacer for Desktop Layout */}
                                    <div className="flex-1 w-full hidden md:flex justify-center px-4 md:px-24 items-center">
                                        {item.image_url ? (
                                            <div 
                                                onClick={() => setPreviewPhoto(item.image_url || null)}
                                                className="relative w-full aspect-[16/10] max-w-md rounded-2xl overflow-hidden shadow-lg group flex items-center justify-center bg-white/90 border border-slate-200 cursor-pointer"
                                            >
                                                <img
                                                    src={getOptimizedImageUrl(item.image_url, 800, 85)}
                                                    srcSet={getImageSrcSet(item.image_url)}
                                                    sizes="(max-width: 768px) 100vw, 500px"
                                                    alt={item.title}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors duration-300 flex items-center justify-center pointer-events-none">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 shadow-lg border border-white/20">
                                                        <ZoomIn className="w-3.5 h-3.5 text-teal-400" />
                                                        <span>Agrandir</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full" />
                                        )}
                                    </div>

                                    {/* Content Card */}
                                    <div className="flex-1 w-full px-4 md:px-24">
                                        <TimelineCard item={item} />
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Modal Lightbox Plein Écran Histoire */}
            {previewPhoto && (
                <div 
                    className="fixed inset-0 z-[1010] bg-black/95 flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
                    onClick={() => setPreviewPhoto(null)}
                >
                    <div className="relative max-w-6xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setPreviewPhoto(null)}
                            className="absolute -top-12 right-0 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X className="w-7 h-7" />
                        </button>
                        <img 
                            src={getOptimizedImageUrl(previewPhoto, 1920, 90)} 
                            alt="Photo archive histoire" 
                            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                        />
                    </div>
                </div>
            )}
        </section>
    );
};

export default HistoryTimeline;
