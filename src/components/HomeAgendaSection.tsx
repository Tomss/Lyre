import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, MapPin, Music, ArrowRight } from 'lucide-react';

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
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);

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

                    if (top10Events.length > 0) {
                        setEvents(top10Events);
                    } else {
                        setEvents([]);
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
        <section id="agenda" className="py-24 bg-slate-900 relative scroll-mt-20 overflow-hidden group/section text-white">
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
                onMouseLeave={() => setIsPaused(false)}
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
                        className="flex gap-8 px-8 py-12 overflow-x-auto no-scrollbar"
                    >
                        {events.map((event, index) => (
                            <div key={`${event.id}-${index}`} className="w-[350px] md:w-[400px] shrink-0 group relative h-[500px]">
                                {/* Dark Glass Card - Teal / Emerald Theme */}
                                <div className="h-full bg-slate-800/50 backdrop-blur-sm rounded-[2rem] border border-white/10 shadow-xl shadow-black/30 hover:shadow-2xl hover:shadow-teal-900/30 hover:bg-slate-800/80 hover:border-teal-500/40 transition-all duration-300 overflow-hidden flex flex-col relative group hover:-translate-y-2">

                                    {/* Image / Header */}
                                    <div className="h-[240px] relative overflow-hidden bg-slate-900/50 flex-shrink-0">
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80 z-10"></div>
                                        {event.image_url ? (
                                            <img
                                                src={event.image_url}
                                                alt={event.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
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
                                                {event.event_type === 'divers' ? 'Divers' : event.event_type}
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
        </section>
    );
};

export default HomeAgendaSection;
