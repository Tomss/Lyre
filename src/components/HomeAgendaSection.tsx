import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, MapPin, Music, ArrowRight, X } from 'lucide-react';

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
        // Do not unpause immediately if still hovering the section, but mouseLeave on container handles that.
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
                    const now = new Date();
                    const nextEvents = data
                        .filter((e: any) => new Date(e.event_date) >= now)
                        .sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

                    const top10Events = nextEvents.slice(0, 10);
                    const allFutureEvents = nextEvents; // Or a limit like slice(0, 50) of future events

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
    }, [isPaused, events]);

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
        <section id="agenda" className="py-24 bg-slate-900 relative scroll-mt-28 overflow-hidden group/section text-white">
            {/* Modal Événement */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200" onClick={(e) => e.stopPropagation()}>
                        {/* Header/Image */}
                        <div className="relative h-64 sm:h-80 bg-slate-800 flex-shrink-0">
                            {selectedEvent.image_url ? (
                                <img src={selectedEvent.image_url} alt={selectedEvent.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-teal-400">
                                    <Music className="h-16 w-16 mb-4 opacity-50" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
                            
                            {/* Bouton Fermeture */}
                            <button 
                                onClick={() => setSelectedEvent(null)}
                                className="absolute top-4 right-4 w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full text-white flex items-center justify-center transition-colors border border-white/20"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            {/* Type Badge */}
                            <div className="absolute top-4 left-4">
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
                            <h2 className="font-poppins font-bold text-2xl sm:text-3xl text-slate-800 mb-6 leading-tight">
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
                                    {new Date(selectedEvent.event_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center text-slate-700 font-medium">
                                    <MapPin className="w-5 h-5 mr-3 text-teal-600" />
                                    {selectedEvent.location || 'Lieu à définir'}
                                </div>
                            </div>

                            {selectedEvent.description && (
                                <div className="prose prose-slate prose-teal max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {selectedEvent.description}
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
                                <h2 className="font-poppins font-bold text-2xl text-white">Agenda Complet</h2>
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
                                                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
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
                                            <h3 className="font-poppins font-bold text-sm sm:text-base text-white mb-1 group-hover:text-teal-300 transition-colors truncate">
                                                {item.title}
                                            </h3>
                                            <div className="flex items-center space-x-4 text-slate-400 text-xs hidden sm:flex">
                                                <div className="flex items-center">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {new Date(item.event_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="flex items-center truncate">
                                                    <MapPin className="w-3 h-3 mr-1" />
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
                                                <span className={`${
                                                    item.event_type === 'concert' ? 'text-emerald-400' : 
                                                    item.event_type === 'divers' ? 'text-purple-400' : 'text-blue-400'
                                                }`}>{item.event_type === 'divers' ? 'Divers' : item.event_type === 'concert' ? 'Concert' : item.event_type === 'repetition' ? 'Répétition' : 'Autre'}</span>
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-12 text-center text-slate-400">
                                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        Aucun événement à venir.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Overlay Click to Close */}
                    <div className="absolute inset-0 -z-10" onClick={() => setIsAllEventsModalOpen(false)}></div>
                </div>
            )}

            {/* Background Texture & Decoration (Matches 'Classes & Profs' style) */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent"></div>

            {/* Ambient Background Glows - Adjusted to Teal/Emerald */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-900/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-900/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12 relative z-10">
                <div className="text-center">
                    <h2 className="font-poppins font-bold text-3xl md:text-5xl text-white mb-4 drop-shadow-md">
                        Agenda
                    </h2>
                    <div className="h-1 w-24 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full mx-auto shadow-[0_0_15px_rgba(20,184,166,0.6)]"></div>
                    <p className="mt-4 text-teal-200 max-w-2xl mx-auto font-light tracking-wide">
                        Ne manquez pas nos prochains rendez-vous musicaux
                    </p>
                </div>
            </div>

            {/* Slider Container */}
            <div
                className="relative w-full"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={handleMouseLeave}
            >
                {/* Gradient Masks (Darker for dark theme) */}
                <div className="absolute inset-y-0 left-0 w-32 md:w-64 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent z-20 pointer-events-none"></div>
                <div className="absolute inset-y-0 right-0 w-32 md:w-64 bg-gradient-to-l from-slate-900 via-slate-900/90 to-transparent z-20 pointer-events-none"></div>

                {/* Navigation Buttons (Updated for Dark Theme / Teal) */}
                <button
                    onClick={() => scrollManual('left')}
                    className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-slate-800/50 backdrop-blur-md shadow-lg shadow-black/20 border border-white/10 text-teal-400 flex items-center justify-center hover:bg-teal-600 hover:text-white hover:border-teal-500 transition-all duration-300 opacity-0 group-hover/section:opacity-100 translate-x-4 group-hover/section:translate-x-0 cursor-pointer"
                    aria-label="Précédent"
                >
                    <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <button
                    onClick={() => scrollManual('right')}
                    className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-slate-800/50 backdrop-blur-md shadow-lg shadow-black/20 border border-white/10 text-teal-400 flex items-center justify-center hover:bg-teal-600 hover:text-white hover:border-teal-500 transition-all duration-300 opacity-0 group-hover/section:opacity-100 -translate-x-4 group-hover/section:translate-x-0 cursor-pointer"
                    aria-label="Suivant"
                >
                    <ArrowRight className="w-5 h-5" />
                </button>

                {/* Scrollable Track */}
                {events.length > 0 ? (
                    <div
                        ref={scrollRef}
                        className={`flex gap-8 px-8 py-12 overflow-x-auto no-scrollbar select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
                        {events.map((event, index) => (
                            <div key={`${event.id}-${index}`} className="w-[350px] md:w-[400px] shrink-0 group relative h-[500px]">
                                {/* Dark Glass Card - Teal / Emerald Theme */}
                                <div className="h-full bg-slate-800/50 backdrop-blur-sm rounded-[2rem] border border-white/10 shadow-xl shadow-black/30 hover:shadow-2xl hover:shadow-teal-900/30 hover:bg-slate-800/80 hover:border-teal-500/40 transition-all duration-300 overflow-hidden flex flex-col relative group hover:-translate-y-2">

                                    {/* Click Overlay (avoids text selection/dragging issues) */}
                                    <div 
                                        className="absolute inset-0 z-30 cursor-pointer" 
                                        onClick={() => {
                                            if (dragDistance < 10) setSelectedEvent(event);
                                        }}
                                    ></div>

                                    {/* Image / Header */}
                                    <div className="h-[240px] relative overflow-hidden bg-slate-900/50 flex-shrink-0">
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80 z-10"></div>
                                        {event.image_url ? (
                                            <img
                                                src={event.image_url}
                                                alt={event.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100 pointer-events-none"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-30">
                                                <Music className="h-20 w-20 text-teal-400" />
                                            </div>
                                        )}

                                        {/* Date Badge - Dark Theme / Teal Adaptation */}
                                        <div className="absolute top-4 right-4 z-20">
                                            <div className="bg-slate-900/80 backdrop-blur-md pl-4 pr-1 py-1 rounded-full flex items-center gap-3 shadow-lg border border-white/10 group-hover:border-teal-500/50 transition-colors">
                                                <span className="text-xs font-bold uppercase text-teal-300 tracking-wider">
                                                    {new Date(event.event_date).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                                                </span>
                                                <div className="bg-gradient-to-br from-teal-500 to-emerald-500 text-white rounded-full w-10 h-10 flex flex-col items-center justify-center shadow-md shadow-teal-500/30">
                                                    <span className="text-sm font-black leading-none">{new Date(event.event_date).getDate()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Type Badge */}
                                        <div className="absolute bottom-4 left-4 z-20">
                                            <span className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase tracking-wide shadow-sm flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor] ${
                                                    event.event_type === 'concert' ? 'bg-emerald-400 text-emerald-400' : 
                                                    event.event_type === 'divers' ? 'bg-purple-400 text-purple-400' : 'bg-blue-400 text-blue-400'
                                                }`}></div>
                                                {event.event_type === 'divers' ? 'Divers' : event.event_type === 'concert' ? 'Concert' : event.event_type === 'repetition' ? 'Répétition' : 'Autre'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="p-8 flex-grow flex flex-col relative z-10">
                                        <h3 className="font-poppins font-bold text-xl text-white mb-3 group-hover:text-teal-300 transition-colors line-clamp-2 leading-tight">
                                            {event.title}
                                        </h3>

                                        {/* Separator - Gradient Teal */}
                                        <div className="h-px w-10 bg-gradient-to-r from-teal-500 to-transparent mb-4 opacity-50"></div>

                                        <div className="space-y-4 mt-auto">
                                            <div className="flex items-center text-slate-300 text-sm font-medium bg-white/5 p-2 rounded-xl border border-white/5 group-hover:border-teal-500/20 transition-colors">
                                                <Clock className="w-4 h-4 mr-3 text-teal-400" />
                                                {new Date(event.event_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="flex items-center text-slate-300 text-sm font-medium bg-white/5 p-2 rounded-xl border border-white/5 group-hover:border-teal-500/20 transition-colors">
                                                <MapPin className="w-4 h-4 mr-3 text-teal-400" />
                                                <span className="truncate max-w-[280px]">{event.location || 'Lieu à définir'}</span>
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
                    className="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-white bg-slate-800/80 backdrop-blur-md rounded-full border border-white/10 hover:bg-teal-600 hover:border-teal-500 hover:scale-105 transition-all duration-300 shadow-lg shadow-black/20 hover:shadow-teal-900/40 cursor-pointer"
                >
                    Voir tout l'agenda
                    <ArrowRight className="ml-2 h-4 w-4" />
                </button>
            </div>
        </section>
    );
};

export default HomeAgendaSection;
