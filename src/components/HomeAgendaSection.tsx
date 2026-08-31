import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, MapPin, Music, ArrowRight, X, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    const [isPaused, setIsPaused] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
    const [isAllEventsModalOpen, setIsAllEventsModalOpen] = useState(false);
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

    // Prevent body scroll when either modal is open
    useEffect(() => {
        if (isAllEventsModalOpen || selectedEvent) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isAllEventsModalOpen, selectedEvent]);

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
    if (events.length === 0) return null;

    return (
        <section id="agenda" className="py-24 bg-slate-50 relative overflow-hidden scroll-mt-20 group/section">
            {/* Modal Événement */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-[95vw] sm:max-w-[85vw] lg:max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 relative mb-4 mt-4" onClick={(e) => e.stopPropagation()}>
                        {/* Header/Image */}
                        <div className="relative aspect-[16/9] sm:aspect-[21/9] bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
                            {selectedEvent.image_url ? (
                                <img 
                                    src={getOptimizedImageUrl(selectedEvent.image_url, 1600, 85)} 
                                    srcSet={getImageSrcSet(selectedEvent.image_url)}
                                    sizes="(max-width: 768px) 100vw, 900px"
                                    alt={selectedEvent.title} 
                                    className="w-full h-full object-cover" 
                                />
                            ) : (
                                <div className="w-full h-64 flex flex-col items-center justify-center bg-teal-50 text-teal-300">
                                    <Music className="h-16 w-16 mb-4 opacity-50" />
                                </div>
                            )}
                            
                            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none z-10"></div>
                            
                            {/* Bouton Fermeture */}
                            <button 
                                onClick={() => setSelectedEvent(null)}
                                className="absolute top-4 right-4 w-10 h-10 bg-black/40 hover:bg-black/70 backdrop-blur-md rounded-full text-white flex items-center justify-center transition-all z-20 border border-white/20 hover:scale-110"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            {/* Date Superposée */}
                            <div className="absolute bottom-4 left-4 flex items-center text-white/90 text-xs font-semibold z-20 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                                <CalendarDays className="w-3.5 h-3.5 mr-2 text-teal-400" />
                                {new Date(selectedEvent.event_date).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </div>

                            {/* Type Badge */}
                            <div className="absolute top-4 left-4 z-20">
                                <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider border border-white/20">
                                    {selectedEvent.event_type === 'divers' ? 'Divers' : selectedEvent.event_type === 'concert' ? 'Concert' : selectedEvent.event_type === 'repetition' ? 'Répétition' : 'Autre'}
                                </span>
                            </div>
                        </div>

                        {/* Contenu */}
                        <div className="p-6 sm:p-8">
                            <h2 className="font-bold text-xl sm:text-2xl text-slate-800 mb-4 leading-tight">
                                {selectedEvent.title}
                            </h2>

                            {/* Info Horaires / Lieu */}
                            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm">
                                <div className="flex items-center text-slate-700 font-medium">
                                    <Clock className="w-4 h-4 mr-2 text-teal-600 flex-shrink-0" />
                                    <span>
                                        {(() => {
                                            const startTime = new Date(selectedEvent.event_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
                                            if (selectedEvent.end_time) {
                                                const endTime = selectedEvent.end_time.slice(0, 5).replace(':', 'h');
                                                return `${startTime} à ${endTime}`;
                                            }
                                            return startTime;
                                        })()}
                                    </span>
                                </div>
                                <div className="flex items-center text-slate-700 font-medium">
                                    <MapPin className="w-4 h-4 mr-2 text-rose-500 flex-shrink-0" />
                                    <span>{selectedEvent.location || 'Lieu à définir'}</span>
                                </div>
                                {selectedEvent.orchestras && selectedEvent.orchestras.length > 0 && (
                                    <div className="flex items-center text-teal-800 font-semibold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                                        <Music className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
                                        <span>{selectedEvent.orchestras.map(o => o.name).join(', ')}</span>
                                    </div>
                                )}
                            </div>

                            {selectedEvent.description && (
                                <div className="prose prose-slate prose-teal max-w-none text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                                    {selectedEvent.description}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Overlay Click to Close */}
                    <div className="absolute inset-0 -z-10" onClick={() => setSelectedEvent(null)}></div>
                </div>
            )}

            {/* Modal "Tous les Événements" */}
            {isAllEventsModalOpen && !selectedEvent && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Header Modal */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                            <div>
                                <h2 className="font-bold text-2xl text-slate-800">Agenda Complet</h2>
                                <p className="text-slate-500 text-sm">Tous nos prochains rendez-vous</p>
                            </div>
                            <button 
                                onClick={() => setIsAllEventsModalOpen(false)}
                                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Liste au scroll */}
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50">
                            <div className="flex flex-col space-y-3">
                                {allEvents.map((item) => (
                                    <div 
                                        key={item.id}
                                        onClick={() => setSelectedEvent(item)}
                                        className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-teal-300 transition-all cursor-pointer flex items-center p-3 group overflow-hidden"
                                    >
                                        <div className="w-24 h-24 sm:w-32 sm:h-24 flex-shrink-0 bg-slate-100 relative rounded-lg overflow-hidden mr-4">
                                            {item.image_url ? (
                                                <img src={item.image_url.startsWith('http') ? item.image_url : `${BASE_URL}${item.image_url}`} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-teal-300 bg-teal-50">
                                                    <Music className="w-6 h-6 opacity-50 mb-1" />
                                                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-50">Agenda</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <div className="flex items-center text-[10px] sm:text-xs font-bold text-teal-600 mb-1">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {new Date(item.event_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </div>
                                            <h3 className="font-bold text-sm sm:text-base text-slate-800 mb-1 group-hover:text-teal-700 transition-colors truncate">
                                                {item.title}
                                            </h3>
                                            {item.description && (
                                                <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed hidden sm:block mb-1">
                                                    {item.description}
                                                </p>
                                            )}
                                            <div className="flex items-center space-x-4 text-slate-500 text-xs hidden sm:flex">
                                                <div className="flex items-center">
                                                    <Clock className="w-3 h-3 mr-1 text-teal-600" />
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
                                                    <MapPin className="w-3 h-3 mr-1 text-rose-500" />
                                                    {item.location || 'Lieu à définir'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Overlay Click to Close */}
                    <div className="absolute inset-0 -z-10" onClick={() => setIsAllEventsModalOpen(false)}></div>
                </div>
            )}

            {/* Background Accents */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-50"></div>

            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mb-12 relative z-10">
                <div className="text-center">
                    <h2 className="font-bold text-3xl md:text-5xl text-slate-900 mb-4">
                        Prochains Événements
                    </h2>
                    <div className="h-1 w-24 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full mx-auto shadow-sm shadow-teal-100"></div>
                </div>
            </div>

            {/* Slider Container */}
            <div
                className="relative w-full"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={handleMouseLeave}
            >
                {/* Navigation Buttons */}
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

                {/* Scrollable Track */}
                <div
                    ref={scrollRef}
                    className={`flex gap-8 px-20 md:px-24 py-12 overflow-x-auto no-scrollbar select-none overscroll-x-contain touch-pan-y ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className="w-[300px] md:w-[350px] shrink-0 h-[450px]"
                        >
                            <div className="h-full bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-teal-400 transition-all duration-200 overflow-hidden flex flex-col relative group">
                                {/* Click Overlay */}
                                <div 
                                    className="absolute inset-0 z-30 cursor-pointer" 
                                    onClick={() => {
                                        if (dragDistance < 10) setSelectedEvent(event);
                                    }}
                                ></div>

                                {/* Image Section */}
                                <div className="aspect-[16/10] relative overflow-hidden bg-slate-100 flex-shrink-0">
                                    {event.image_url ? (
                                        <img
                                            src={getOptimizedImageUrl(event.image_url, 700, 80)}
                                            srcSet={getImageSrcSet(event.image_url)}
                                            sizes="(max-width: 640px) 300px, 350px"
                                            alt={event.title}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-teal-50 text-teal-300">
                                            <Music className="h-16 w-16 mb-4 opacity-50" />
                                            <span className="text-xs font-bold uppercase tracking-widest opacity-70">Agenda</span>
                                        </div>
                                    )}

                                    {/* Date Badge */}
                                    <div className="absolute top-4 left-4 z-20">
                                        <div className="bg-white/95 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-md border border-slate-100">
                                            <span className="text-sm font-black text-teal-600 leading-none">{new Date(event.event_date).getDate()}</span>
                                            <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                                                {new Date(event.event_date).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Type Badge */}
                                    <div className="absolute top-4 right-4 z-20">
                                        <span className="px-2.5 py-1 rounded-full bg-slate-900/80 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                                            {event.event_type === 'divers' ? 'Divers' : event.event_type === 'concert' ? 'Concert' : event.event_type === 'repetition' ? 'Répétition' : 'Autre'}
                                        </span>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-6 flex flex-col flex-1 bg-white">
                                    <h3 className="font-bold text-lg text-slate-900 mb-2 leading-snug group-hover:text-teal-600 transition-colors line-clamp-2">
                                        {event.title}
                                    </h3>

                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-4 font-normal">
                                        {event.description || 'Rejoignez-nous pour cet événement musical exceptionnel !'}
                                    </p>

                                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                                        <div className="flex flex-col gap-0.5 text-xs min-w-0 pr-2">
                                            <div className="flex items-center font-bold text-teal-700">
                                                <Clock className="w-3.5 h-3.5 mr-1.5 text-teal-600 flex-shrink-0" />
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
                                            <div className="flex items-center text-slate-500 truncate" title={event.location || 'Lieu à définir'}>
                                                <MapPin className="w-3.5 h-3.5 mr-1.5 text-rose-500 flex-shrink-0" />
                                                <span className="truncate">{event.location || 'Lieu à définir'}</span>
                                            </div>
                                        </div>

                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-teal-600 group-hover:text-white transition-colors flex-shrink-0">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 text-center relative z-10">
                <div className="flex flex-wrap items-center justify-center gap-4">
                    {allEvents.length > 0 && (
                        <button
                            onClick={() => setIsAllEventsModalOpen(true)}
                            className="inline-flex items-center px-6 py-3 rounded-full bg-teal-50 border border-teal-200 text-teal-700 font-bold hover:bg-teal-600 hover:text-white transition-all duration-300 shadow-sm cursor-pointer"
                        >
                            <span>Voir tout l'agenda ({allEvents.length})</span>
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    )}
                    <Link
                        to="/evenements"
                        className="inline-flex items-center px-6 py-3 rounded-full bg-white border border-slate-200 text-slate-700 font-bold hover:border-teal-500 hover:text-teal-600 transition-all duration-300 shadow-sm"
                    >
                        <span>Calendrier complet</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                </div>
            </div>
        </section>
    );
});

export default HomeAgendaSection;
