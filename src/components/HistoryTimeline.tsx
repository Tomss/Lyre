import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

type HistoryEra = 'vintage' | 'retro' | 'classic' | 'modern';

import { API_URL } from '../config';

const BASE_URL = API_URL.replace('/api', '');

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
    const shouldTruncate = item.content.length > 200;

    // Dynamic Styles based on Era
    let cardStyle = "";
    let dateStyle = "";
    let buttonStyle = "";

    switch (item.era) {
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
    }

    const displayText = isExpanded ? item.content : item.content.slice(0, 200) + (shouldTruncate ? "..." : "");

    return (
        <div className={`p-5 md:p-6 relative ${cardStyle} transition-all duration-300 hover:scale-[1.01]`}>
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
            }
        };
        fetchHistory();
    }, []);

    return (
        <section className="py-12 bg-white overflow-hidden relative">
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
                                            <div className="relative w-full h-64 max-w-md rounded-xl overflow-hidden shadow-lg transform hover:scale-[1.02] transition-all duration-500 group flex items-center justify-center bg-white/50">
                                                <img
                                                    src={item.image_url.startsWith('http') ? item.image_url : `${BASE_URL}${item.image_url}`}
                                                    alt={item.title}
                                                    className="w-full h-full object-contain"
                                                />
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
        </section>
    );
};

export default HistoryTimeline;
