import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, MapPin, Music, ArrowRight, X, ZoomIn } from 'lucide-react';

import { API_URL, BASE_URL } from '../config';
import { getOptimizedImageUrl, getImageSrcSet } from '../utils/image';

interface EventItem {
    id: string;
    title: string;
    description?: string;
    event_date: string;
    end_time?: string | null;
    location?: string;
    image_url?: string;
    event_type: 'concert' | 'repetition' | 'divers';
    orchestras?: { id: string; name: string }[];
}

const HomeAgendaSection = React.memo(() => {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [allEvents, setAllEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
    const [isAllEventsModalOpen, setIsAllEventsModalOpen] = useState(false);

    // Refs for drag to prevent ANY React re-render during mouse interactions
    const isDraggingRef = useRef(false);
    const startXRef = useRef(0);
    const scrollLeftRef = useRef(0);
    const dragDistanceRef = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        isDraggingRef.current = true;
        startXRef.current = e.pageX - scrollRef.current.offsetLeft;
        scrollLeftRef.current = scrollRef.current.scrollLeft;
        dragDistanceRef.current = 0;
    };

    const handleMouseLeave = () => {
        isDraggingRef.current = false;
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingRef.current || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startXRef.current) * 1.5;
        dragDistanceRef.current = Math.abs(walk);
        scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
    };

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch(`${API_URL}/public-events`);
                if (response.ok) {
                    const data = await response.json();
                    const nextEvents = data
                        .filter((e: any) => new Date(e.event_date) >= new Date())
                        .sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

                    const top10Events = nextEvents.slice(0, 10);
                    const allFutureEvents = nextEvents;

                    if (top10Events.length > 0) {
                        setEvents(top10Events);
                        setAllEvents(allFutureEvents);
                    } else {
                        setEvents([]);
                        setAllEvents([]);
                    }
                }
            } catch (error) {
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
                setTimeout(() => {
                    if ((window as any).__lenis) {
                        (window as any).__lenis.resize();
                    }
                }, 50);
            }
        };
        fetchEvents();
    }, []);

    // Prevent body scroll when modal is open
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (previewPhoto) setPreviewPhoto(null);
                else if (selectedEvent) setSelectedEvent(null);
                else if (isAllEventsModalOpen) setIsAllEventsModalOpen(false);
            }
        };
        if (selectedEvent || isAllEventsModalOpen || previewPhoto) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
            if ((window as any).__lenis) {
                (window as any).__lenis.resize();
            }
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
            if ((window as any).__lenis) {
                (window as any).__lenis.resize();
            }
        };
    }, [selectedEvent, isAllEventsModalOpen, previewPhoto]);

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

    return (
        <section id="agenda" className="py-24 bg-slate-900 relative scroll-mt-20 overflow-hidden group/section text-white">
            {/* Lightbox / Preview Photo */}
            {previewPhoto && (
                <div 
                    className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setPreviewPhoto(null)}
                >
                    <div className="relative max-w-5xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setPreviewPhoto(null)}
                            className="absolute -top-12 right-0 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X className="w-7 h-7" />
                        </button>
                        <img 
                            src={getOptimizedImageUrl(previewPhoto, 1920, 90)} 
                            alt="Photo événement" 
                            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                        />
                    </div>
                </div>
            )}

            {/* Modal Événement */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200" onClick={(e) => e.stopPropagation()}>
                        {/* Header/Image */}
                        <div 
                            className={`relative aspect-[16/10] sm:max-h-[360px] bg-slate-800 flex-shrink-0 overflow-hidden ${selectedEvent.image_url ? 'cursor-pointer group' : ''}`}
                            onClick={() => {
                                if (selectedEvent.image_url) setPreviewPhoto(selectedEvent.image_url);
                            }}
                        >
                            {selectedEvent.image_url ? (
                                <>
                                    <img 
                                        src={getOptimizedImageUrl(selectedEvent.image_url, 1200, 85)} 
                                        srcSet={getImageSrcSet(selectedEvent.image_url)}
                                        sizes="(max-width: 768px) 100vw, 800px"
                                        alt={selectedEvent.title} 
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                    />
                                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors duration-300 flex items-center justify-center pointer-events-none">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur-sm text-white px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 shadow-lg border border-white/20">
                                            <ZoomIn className="w-3.5 h-3.5 text-teal-400" />
                                            <span>Agrandir</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-teal-400">
                                    <Music className="h-16 w-16 mb-4 opacity-50" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent pointer-events-none"></div>
                            
                            {/* Bouton Fermeture */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvent(null);
                                }}
                                className="absolute top-4 right-4 w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full text-white flex items-center justify-center transition-colors border border-white/20 z-20"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            {/* Type Badge */}
                            <div className="absolute top-4 left-4 z-20">
                                <span className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-wide shadow-sm flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor] ${
                                        selectedEvent.event_type === 'concert' ? 'bg-emerald-400 text-emerald-400' : 
                                        selectedEvent.event_type === 'divers' ? 'bg-purple-400 text-purple-400' : 'bg-blue-400 text-blue-400'
                                    }`}></div>
                                    {selectedEvent.event_type === 'divers' ? 'Divers' : selectedEvent.event_type === 'concert' ? 'Concert' : selectedEvent.event_type === 'repetition' ? 'Répétition' : 'Autre'}
                                </span>
                            </div>
                        </div>

                        {/* Contenu */}
                        <div className="p-8 sm:p-10 text-slate-900">
                            <h2 className="font-bold text-2xl sm:text-3xl text-slate-800 mb-6 leading-tight">
                                {selectedEvent.title}
                            </h2>

                            <div className="flex flex-col sm:flex-row gap-6 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center text-slate-700 font-medium">
                                    <Calendar className="w-5 h-5 mr-3 text-teal-600" />
                                    {new Date(selectedEvent.event_date).toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </div>
                                <div className="flex items-center text-slate-700 font-medium">
                                    <Clock className="w-5 h-5 mr-3 text-teal-600" />
                                    {(() => {
                                        const startTime = new Date(selectedEvent.event_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
                                        if (selectedEvent.end_time) {
                                            const endTime = selectedEvent.end_time.slice(0, 5).replace(':', 'h');
                                            return `${startTime} à ${endTime}`;
                                        }
                                        return startTime;
                                    })()}
                                </div>
                                <div className="flex items-center text-slate-700 font-medium">
                                    <MapPin className="w-5 h-5 mr-3 text-teal-600" />
                                    {selectedEvent.location || 'Lieu à définir'}
                                </div>
                            </div>

                            {selectedEvent.description && (
                                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Description</h3>
                                    <p className="text-base text-slate-600">{selectedEvent.description}</p>
                                </div>
                            )}

                            {selectedEvent.orchestras && selectedEvent.orchestras.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Orchestres participants</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedEvent.orchestras.map(orch => (
                                            <span key={orch.id} className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 font-medium text-sm border border-teal-100 flex items-center">
                                                <Music className="w-3.5 h-3.5 mr-1.5 text-teal-500" />
                                                {orch.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Overlay Click to Close */}
                    <div className="absolute inset-0 -z-10" onClick={() => setSelectedEvent(null)}></div>
                </div>
            )}

            {/* Modal "Tout l'Agenda" */}
            {isAllEventsModalOpen && !selectedEvent && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-slate-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Header Modal */}
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900 z-10">
                            <div>
                                <h2 className="font-bold text-2xl text-white">Agenda Complet</h2>
                                <p className="text-teal-400 text-sm">Tous les événements à venir</p>
                            </div>
                            <button 
                                onClick={() => setIsAllEventsModalOpen(false)}
                                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 flex items-center justify-center transition-colors border border-slate-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Liste au scroll */}
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-800/50">
                            <div className="flex flex-col space-y-3">
                                {allEvents.length > 0 ? allEvents.map((item) => (
                                    <div 
                                        key={item.id}
                                        onClick={() => setSelectedEvent(item)}
                                        className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 hover:shadow-lg hover:border-teal-500/50 transition-all cursor-pointer flex items-center p-3 group overflow-hidden"
                                    >
                                        <div className="w-24 h-24 sm:w-32 sm:h-24 flex-shrink-0 bg-slate-900 relative rounded-lg overflow-hidden mr-4">
                                            {item.image_url ? (
                                                <img src={getOptimizedImageUrl(item.image_url, 400, 80)} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-teal-400 bg-slate-900">
                                                    <Music className="w-8 h-8 opacity-30" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <div className="flex items-center text-[10px] sm:text-xs font-bold text-teal-400 mb-1">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {new Date(item.event_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </div>
                                            <h3 className="font-bold text-sm sm:text-base text-white mb-1 group-hover:text-teal-300 transition-colors truncate">
                                                {item.title}
                                            </h3>
                                            {item.description && (
                                                <p className="text-slate-400 text-xs line-clamp-1 leading-relaxed hidden sm:block mb-1 font-normal">
                                                    {item.description}
                                                </p>
                                            )}
                                            <div className="flex items-center space-x-4 text-slate-400 text-xs hidden sm:flex">
                                                <div className="flex items-center">
                                                    <Clock className="w-3 h-3 mr-1 text-teal-400" />
                                                    {(() => {
                                                        const startTime = new Date(item.event_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
                                                        if (item.end_time) {
                                                            const endTime = item.end_time.slice(0, 5).replace(':', 'h');
                                                            return `${startTime} à ${endTime}`;
                                                        }
                                                        return startTime;
                                                    })()}
                                                </div>
                                                <div className="flex items-center truncate">
                                                    <MapPin className="w-3 h-3 mr-1 text-rose-400" />
                                                    {item.location || 'Lieu à définir'}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Type Badge */}
                                        <div className="ml-auto hidden md:block">
                                            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 opacity-80">
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    item.event_type === 'concert' ? 'bg-emerald-400' : 
                                                    item.event_type === 'divers' ? 'bg-purple-400' : 'bg-blue-400'
                                                }`}></div>
                                                <span className="text-slate-300">{item.event_type === 'divers' ? 'Divers' : item.event_type === 'concert' ? 'Concert' : item.event_type === 'repetition' ? 'Répétition' : 'Autre'}</span>
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-slate-400">Aucun événement trouvé</div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Overlay Click to Close */}
                    <div className="absolute inset-0 -z-10" onClick={() => setIsAllEventsModalOpen(false)}></div>
                </div>
            )}

            {/* Header Section - Titre Pur et Direct */}
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center relative z-10">
                <h2 className="font-bold text-3xl md:text-5xl text-white">
                    Agenda
                </h2>
            </div>

            {/* Slider Container */}
            <div className="relative w-full">
                {/* Navigation Buttons */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        scrollManual('left');
                    }}
                    className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-slate-800/90 hover:bg-teal-600 text-white shadow-xl border border-slate-700 hover:border-teal-500 flex items-center justify-center transition-all duration-200 cursor-pointer"
                    aria-label="Précédent"
                >
                    <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        scrollManual('right');
                    }}
                    className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-slate-800/90 hover:bg-teal-600 text-white shadow-xl border border-slate-700 hover:border-teal-500 flex items-center justify-center transition-all duration-200 cursor-pointer"
                    aria-label="Suivant"
                >
                    <ArrowRight className="w-5 h-5" />
                </button>

                {/* Track */}
                {events.length > 0 ? (
                    <div
                        ref={scrollRef}
                        className="flex gap-8 px-20 md:px-24 py-12 overflow-x-auto no-scrollbar select-none cursor-grab active:cursor-grabbing"
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
                        {events.map((event) => (
                            <div key={event.id} className="w-[310px] md:w-[360px] shrink-0 h-[490px]">
                                {/* Dark Card */}
                                <div className="h-full bg-slate-800 rounded-3xl border border-slate-700 hover:border-teal-400/80 shadow-lg hover:shadow-2xl hover:shadow-teal-950/30 transition-all duration-200 overflow-hidden flex flex-col relative group">
                                    {/* Click Overlay */}
                                    <div 
                                        className="absolute inset-0 z-30 cursor-pointer" 
                                        onClick={() => {
                                            if (dragDistanceRef.current < 10) setSelectedEvent(event);
                                        }}
                                    ></div>

                                    {/* Image / Header */}
                                    <div className="h-[190px] relative overflow-hidden bg-slate-900 flex-shrink-0">
                                        {event.image_url ? (
                                            <img
                                                src={getOptimizedImageUrl(event.image_url, 700, 80)}
                                                srcSet={getImageSrcSet(event.image_url)}
                                                sizes="(max-width: 640px) 310px, 360px"
                                                alt={event.title}
                                                loading="lazy"
                                                decoding="async"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-30">
                                                <Music className="h-16 w-16 text-teal-400" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent pointer-events-none"></div>

                                        {/* Date Badge */}
                                        <div className="absolute top-3.5 right-3.5 z-20">
                                            <div className="bg-slate-900/95 px-3 py-1.5 rounded-2xl flex flex-col items-center justify-center shadow-lg border border-teal-400/30 min-w-[54px]">
                                                <span className="text-[11px] font-black uppercase text-teal-400 tracking-wider leading-none">
                                                    {new Date(event.event_date).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                                                </span>
                                                <span className="text-xl font-black text-white leading-none mt-1">
                                                    {new Date(event.event_date).getDate()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Type Badge */}
                                        <div className="absolute bottom-3.5 left-3.5 z-20">
                                            <span className="px-3 py-1 rounded-full bg-slate-900/95 border border-slate-700/80 text-white text-[11px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    event.event_type === 'concert' ? 'bg-emerald-400' :
                                                    event.event_type === 'repetition' ? 'bg-purple-400' : 'bg-blue-400'
                                                }`}></div>
                                                {event.event_type === 'divers' ? 'Divers' : event.event_type === 'concert' ? 'Concert' : event.event_type === 'repetition' ? 'Répétition' : 'Autre'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="p-6 flex-grow flex flex-col bg-slate-800">
                                        {/* Date complète au-dessus du titre */}
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400 uppercase tracking-wide mb-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                                            <span>
                                                {new Date(event.event_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })}
                                            </span>
                                        </div>

                                        {/* Titre */}
                                        <h3 className="font-bold text-lg text-white mb-2 group-hover:text-teal-300 transition-colors line-clamp-1 leading-snug">
                                            {event.title}
                                        </h3>

                                        {/* Description */}
                                        {event.description ? (
                                            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-4 font-normal">
                                                {event.description}
                                            </p>
                                        ) : (
                                            <p className="text-slate-500 text-xs sm:text-sm italic line-clamp-2 mb-4 font-normal">
                                                Rejoignez-nous pour ce rendez-vous musical !
                                            </p>
                                        )}

                                        {/* Blocs Horaires et Lieu */}
                                        <div className="space-y-2 mt-auto pt-3 border-t border-slate-700/70">
                                            {/* Horaire & Orchestre */}
                                            <div className="flex items-center justify-between bg-slate-900/80 rounded-xl px-3 py-2 border border-slate-700/60">
                                                <div className="flex items-center text-teal-300 text-xs font-bold">
                                                    <Clock className="w-4 h-4 mr-2 text-teal-400 flex-shrink-0" />
                                                    <span>
                                                        {(() => {
                                                            const startTime = new Date(event.event_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
                                                            if (event.end_time) {
                                                                const endTime = event.end_time.slice(0, 5).replace(':', 'h');
                                                                return `${startTime} à ${endTime}`;
                                                            }
                                                            return startTime;
                                                        })()}
                                                    </span>
                                                </div>
                                                {event.orchestras && event.orchestras.length > 0 && (
                                                    <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700 truncate max-w-[130px]" title={event.orchestras.map(o => o.name).join(', ')}>
                                                        {event.orchestras[0].name}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Lieu */}
                                            <div className="flex items-center bg-slate-900/80 rounded-xl px-3 py-2 border border-slate-700/60">
                                                <MapPin className="w-4 h-4 mr-2 text-rose-400 flex-shrink-0" />
                                                <span className="text-slate-200 text-xs font-semibold truncate" title={event.location || 'Lieu à définir'}>
                                                    {event.location || 'Lieu à définir'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto px-4">
                        <div className="py-16 text-center bg-white/5 rounded-3xl border border-dashed border-slate-700 text-slate-400 backdrop-blur-sm">
                            <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                            Aucun événement à venir.
                        </div>
                    </div>
                )}
            </div>

            <div className="text-center mt-12 relative z-10">
                <button 
                    onClick={() => setIsAllEventsModalOpen(true)}
                    className="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-white bg-slate-800/80 backdrop-blur-md rounded-full border border-white/10 hover:bg-teal-600 hover:border-teal-500 hover:scale-105 transition-all duration-300 shadow-lg shadow-black/20 hover:shadow-teal-950/40 cursor-pointer"
                >
                    Voir tout l'agenda
                    <ArrowRight className="ml-2 h-4 w-4" />
                </button>
            </div>
        </section>
    );
});

export default HomeAgendaSection;
