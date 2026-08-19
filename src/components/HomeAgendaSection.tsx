import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, MapPin, Music, ArrowRight, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_URL } from '../config';

interface EventItem {
    id: string;
    title: string;
    description?: string;
    event_date: string;
    location?: string;
    image_url?: string;
    event_type: 'concert' | 'repetition' | 'divers';
}

const HomeAgendaSection = () => {
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
        const walk = (x - startX) * 2;
        setDragDistance(Math.abs(walk));
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch(`${API_URL}/events`);
                if (response.ok) {
                    const data = await response.json();
                    const sortedEvents = data.sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
                    const upcomingEvents = sortedEvents.filter((e: any) => new Date(e.event_date) >= new Date());
                    const top10Events = upcomingEvents.slice(0, 10);

                    if (top10Events.length > 0) {
                        setEvents(top10Events);
                        setAllEvents(upcomingEvents);
                    } else {
                        setEvents(sortedEvents.slice(0, 10));
                        setAllEvents(sortedEvents);
                    }
                }
            } catch (error) {
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (selectedEvent || isAllEventsModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedEvent, isAllEventsModalOpen]);

    // Option 1: Discrete auto-advance every 6s (pauses on mouse hover/drag)
    useEffect(() => {
        if (isPaused || events.length <= 1) return;

        const interval = setInterval(() => {
            if (scrollRef.current) {
                const container = scrollRef.current;
                const cardWidth = 360; // Card width + gap
                const maxScrollLeft = container.scrollWidth - container.clientWidth;

                if (container.scrollLeft >= maxScrollLeft - 10) {
                    container.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    container.scrollTo({ left: container.scrollLeft + cardWidth, behavior: 'smooth' });
                }
            }
        }, 6000);

        return () => clearInterval(interval);
    }, [isPaused, events]);

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
        <section id="agenda" className="py-20 bg-slate-900 relative scroll-mt-20 overflow-hidden text-white">
            
            {/* Modal Détails Événement */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-100 overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
                        <div className="relative h-48 sm:h-64 bg-slate-900 flex-shrink-0">
                            {selectedEvent.image_url ? (
                                <img src={selectedEvent.image_url} alt={selectedEvent.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-teal-800 to-slate-900 flex items-center justify-center">
                                    <Calendar className="w-16 h-16 text-teal-400/40" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />

                            <button 
                                onClick={() => setSelectedEvent(null)}
                                className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/40 hover:bg-black/70 rounded-full text-white flex items-center justify-center transition-all border border-white/20"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            <div className="absolute top-4 left-4">
                                <span className="px-3 py-1.5 rounded-full bg-black/60 border border-white/10 text-white text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                        selectedEvent.event_type === 'concert' ? 'bg-emerald-400' : 
                                        selectedEvent.event_type === 'divers' ? 'bg-purple-400' : 'bg-blue-400'
                                    }`}></div>
                                    {selectedEvent.event_type === 'divers' ? 'Divers' : selectedEvent.event_type === 'concert' ? 'Concert' : 'Répétition'}
                                </span>
                            </div>
                        </div>

                        <div className="p-8 sm:p-10 text-slate-900 overflow-y-auto">
                            <h2 className="font-bold text-2xl sm:text-3xl text-slate-800 mb-6 leading-tight">
                                {selectedEvent.title}
                            </h2>

                            <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm">
                                <div className="flex items-center text-slate-700 font-medium">
                                    <Calendar className="w-4 h-4 mr-2.5 text-teal-600 flex-shrink-0" />
                                    {new Date(selectedEvent.event_date).toLocaleDateString('fr-FR', {
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                    })}
                                </div>
                                <div className="flex items-center text-slate-700 font-medium">
                                    <Clock className="w-4 h-4 mr-2.5 text-teal-600 flex-shrink-0" />
                                    {new Date(selectedEvent.event_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center text-slate-700 font-medium">
                                    <MapPin className="w-4 h-4 mr-2.5 text-teal-600 flex-shrink-0" />
                                    {selectedEvent.location || 'Lieu à définir'}
                                </div>
                            </div>

                            {selectedEvent.description && (
                                <div className="prose prose-slate prose-teal max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">
                                    {selectedEvent.description}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="absolute inset-0 -z-10" onClick={() => setSelectedEvent(null)}></div>
                </div>
            )}

            {/* Modal "Tout l'Agenda" */}
            {isAllEventsModalOpen && !selectedEvent && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900 z-10">
                            <div>
                                <h2 className="font-bold text-2xl text-white">Agenda Complet</h2>
                                <p className="text-teal-400 text-xs mt-0.5">Tous les événements de La Lyre</p>
                            </div>
                            <button 
                                onClick={() => setIsAllEventsModalOpen(false)}
                                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 flex items-center justify-center transition-colors border border-slate-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-4">
                            {allEvents.map((event) => (
                                <div 
                                    key={event.id}
                                    onClick={() => setSelectedEvent(event)}
                                    className="p-5 bg-slate-800/80 hover:bg-slate-800 rounded-2xl border border-slate-700 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                                                event.event_type === 'concert' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                            }`}>
                                                {event.event_type === 'concert' ? 'Concert' : (event.event_type === 'repetition' ? 'Répétition' : 'Événement')}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-lg text-white group-hover:text-teal-400 transition-colors">{event.title}</h3>
                                        <p className="text-xs text-slate-400 flex items-center gap-3">
                                            <span>📅 {new Date(event.event_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                            {event.location && <span>📍 {event.location}</span>}
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold text-teal-400 flex items-center group-hover:translate-x-1 transition-transform">
                                        Détails <ArrowRight size={14} className="ml-1" />
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="absolute inset-0 -z-10" onClick={() => setIsAllEventsModalOpen(false)}></div>
                </div>
            )}

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-8 h-8 text-teal-400" />
                            <h2 className="font-extrabold text-3xl md:text-4xl text-white tracking-tight">
                                Prochains Événements
                            </h2>
                        </div>
                        <p className="text-teal-200/80 text-sm font-light">
                            Agenda des répétitions, concerts et rendez-vous musicaux de La Lyre
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsAllEventsModalOpen(true)}
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2"
                        >
                            <span>Voir tout l'agenda</span>
                            <ArrowRight size={14} />
                        </button>

                        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                            <button
                                onClick={() => scrollManual('left')}
                                className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-teal-600 hover:text-white text-slate-300 flex items-center justify-center transition-all cursor-pointer"
                                aria-label="Précédent"
                                title="Événement précédent"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => scrollManual('right')}
                                className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-teal-600 hover:text-white text-slate-300 flex items-center justify-center transition-all cursor-pointer"
                                aria-label="Suivant"
                                title="Événement suivant"
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
                {events.length > 0 ? (
                    <div
                        ref={scrollRef}
                        className={`flex gap-6 px-4 sm:px-8 py-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
                        {events.map((event) => (
                            <div 
                                key={event.id} 
                                className="snap-start shrink-0 w-[300px] sm:w-[350px] group relative h-[420px]"
                            >
                                <div className="h-full bg-slate-800/60 rounded-3xl border border-slate-700/80 shadow-lg hover:shadow-2xl hover:shadow-teal-900/20 hover:border-teal-500/50 transition-all duration-300 overflow-hidden flex flex-col relative group">
                                    <div 
                                        className="absolute inset-0 z-30 cursor-pointer" 
                                        onClick={() => {
                                            if (dragDistance < 10) setSelectedEvent(event);
                                        }}
                                    ></div>

                                    {/* Image / Header */}
                                    <div className="h-[190px] relative overflow-hidden bg-slate-950 flex-shrink-0">
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80 z-10"></div>
                                        {event.image_url ? (
                                            <img
                                                src={event.image_url}
                                                alt={event.title}
                                                loading="lazy"
                                                decoding="async"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-teal-900/60 via-slate-900 to-slate-950 flex items-center justify-center">
                                                <Calendar className="w-14 h-14 text-teal-500/20" />
                                            </div>
                                        )}

                                        <div className="absolute top-4 left-4 z-20">
                                            <span className="px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    event.event_type === 'concert' ? 'bg-emerald-400' : 
                                                    event.event_type === 'divers' ? 'bg-purple-400' : 'bg-blue-400'
                                                }`}></div>
                                                {event.event_type === 'divers' ? 'Divers' : event.event_type === 'concert' ? 'Concert' : 'Répétition'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-6 flex-1 flex flex-col justify-between relative z-20">
                                        <div>
                                            <h3 className="font-bold text-lg text-white mb-3 line-clamp-2 leading-snug group-hover:text-teal-300 transition-colors">
                                                {event.title}
                                            </h3>

                                            <div className="space-y-2 text-xs text-slate-300 font-medium">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-2 text-teal-400 flex-shrink-0" />
                                                    <span>{new Date(event.event_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <Clock className="w-4 h-4 mr-2 text-teal-400 flex-shrink-0" />
                                                    <span>{new Date(event.event_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center truncate">
                                                        <MapPin className="w-4 h-4 mr-2 text-teal-400 flex-shrink-0" />
                                                        <span className="truncate">{event.location}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between">
                                            <span className="text-xs font-bold text-teal-400 flex items-center group-hover:translate-x-1 transition-transform">
                                                Voir la fiche <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400 text-sm">
                        Aucun événement à venir pour le moment.
                    </div>
                )}
            </div>
        </section>
    );
};

export default HomeAgendaSection;
