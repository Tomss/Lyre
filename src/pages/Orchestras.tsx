import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Music } from 'lucide-react';
import PageHero from '../components/PageHero';

interface Orchestra {
    id: string;
    name: string;
    description: string | null;
    photo_url: string | null;
    photos?: { id: string; photo_url: string; display_order: number }[];
}

import { API_URL, BASE_URL } from '../config';

const PhotoStack = ({ photos, altPrefix, height = "h-[400px] md:h-[500px]" }: { photos: { id: string; photo_url: string; display_order: number }[], altPrefix: string, height?: string }) => {
    // Local state to manage the stack order. We clone the props to mutable state.
    const [stack, setStack] = useState(photos);

    useEffect(() => {
        setStack(photos);
    }, [photos]);

    const bringToFront = (index: number) => {
        if (index === 0) return; // Already front
        const newStack = [...stack];
        const [movedPhoto] = newStack.splice(index, 1);
        newStack.unshift(movedPhoto);
        setStack(newStack);
    };

    if (!photos || photos.length === 0) return null;

    if (photos.length === 1) {
        return (
            /* Single Photo Fallback */
            <div className={`relative rounded-2xl overflow-hidden shadow-2xl border-[6px] border-white ${height}`}>
                <img
                    src={photos[0].photo_url.startsWith('http') ? photos[0].photo_url : `${BASE_URL}${photos[0].photo_url}`}
                    alt={altPrefix}
                    className="w-full h-full object-cover transform hover:scale-[1.01] transition-transform duration-700"
                />
            </div>
        );
    }

    return (
        <div className={`relative ${height} w-full perspective-1000`}>
            {stack.slice(0, 3).map((photo, i) => (
                <div
                    key={photo.id}
                    className={`absolute top-0 left-0 w-full h-full transition-all duration-500 ease-out ${i === 0 ? 'z-30 cursor-default' : 'z-20 cursor-pointer hover:translate-y-[-5px]'}`}
                    style={{
                        transform: i === 0
                            ? 'rotate(0deg) scale(1)'
                            : `rotate(${i * 6 * (i % 2 === 0 ? 1 : -1)}deg) translateX(${i * 35}px) translateY(${i * 10}px) scale(${1 - i * 0.05})`,
                        zIndex: 30 - i * 10,
                        opacity: 1 - i * 0.1
                    }}
                    onClick={() => bringToFront(i)}
                >
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border-[6px] border-white h-full bg-slate-200">
                        <img
                            src={photo.photo_url.startsWith('http') ? photo.photo_url : `${BASE_URL}${photo.photo_url}`}
                            alt={`${altPrefix} - ${photo.display_order}`}
                            className="w-full h-full object-cover"
                        />
                        {/* Visual cue for background photos */}
                        {i > 0 && (
                            <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors duration-300"></div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

const Orchestras = () => {
    const { pageHeaders } = useTheme();
    const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    useEffect(() => {
        const fetchOrchestras = async () => {
            try {
                const response = await fetch(`${API_URL}/public-orchestras`);
                if (response.ok) {
                    const data = await response.json();
                    setOrchestras(data);
                }
            } catch (error) {
                console.error('Error fetching orchestras:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrchestras();
    }, []);

    return (
        <div className="font-inter text-slate-900">
            {/* Header Section */}
            <PageHero
                title={<span>Nos <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-500">Orchestres</span></span>}
                subtitle="Découvrez nos différents ensembles et rejoignez celui qui vous correspond."
                backgroundImage={pageHeaders['orchestres'] || "https://images.pexels.com/photos/165971/pexels-photo-165971.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"}
                anchors={orchestras.map((orch, index) => ({
                    label: orch.name,
                    targetId: orch.id,
                    icon: Music,
                    color: index === 0 ? 'emerald' : index === 1 ? 'rose' : index === 2 ? 'indigo' : 'cyan'
                }))}
            />

            {loading ? (
                <div className="flex justify-center items-center py-32">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-500 border-t-transparent"></div>
                </div>
            ) : (
                <>
                    {/* 1. Highlight Section (First Orchestra) */}
                    {orchestras.length > 0 && (
                        <section id={orchestras[0].id} className="py-24 bg-white relative overflow-hidden scroll-mt-20">
                            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="max-w-7xl mx-auto">

                                    {/* Title Section */}
                                    <div className="mb-16 text-center">
                                        <h2 className="text-5xl md:text-7xl font-bold text-slate-900 font-poppins leading-tight tracking-tight">
                                            {orchestras[0].name}
                                        </h2>
                                        <div className="h-2 w-32 bg-teal-500 rounded-full mx-auto mt-6"></div>
                                    </div>

                                    {/* Content with Float Layout */}
                                    <div className="prose prose-lg text-slate-600 font-inter max-w-none clearfix">
                                        {/* Image (Floated Left) */}
                                        <div className="float-none md:float-left w-full md:w-1/2 lg:w-5/12 mr-0 md:mr-16 lg:mr-24 mb-12 lg:mb-16 relative">
                                            <div className="absolute inset-0 bg-teal-500 blur-3xl opacity-20 transform -rotate-12 rounded-full"></div>
                                            {/* Unified PhotoStack Component */}
                                            <PhotoStack
                                                photos={orchestras[0].photos && orchestras[0].photos.length > 0 ? orchestras[0].photos : [{ id: 'default', photo_url: orchestras[0].photo_url || "", display_order: 0 }]}
                                                altPrefix={orchestras[0].name}
                                                height="h-[400px] md:h-[450px]"
                                            />
                                        </div>

                                        {/* Text Wrapping Area */}
                                        <div className="text-justify text-base md:text-lg leading-relaxed">
                                            {orchestras[0].description ? (
                                                orchestras[0].description.split('\n').map((line, i) => (
                                                    <p key={i} className="mb-4 last:mb-0">{line}</p>
                                                ))
                                            ) : (
                                                <p className="mb-4">Une expérience musicale unique au cœur de notre école.</p>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </section>
                    )}

                    {/* 2. Visual Sticky Nav for Other Orchestras */}
                    {orchestras.length > 1 && (
                        <div className={`sticky z-40 bg-white/95 backdrop-blur-xl border-y border-slate-200 shadow-md transform transition-all duration-300 ${isVisible ? 'top-[64px] lg:top-[80px]' : 'top-0'}`}>
                            <div className="container mx-auto px-4 py-3">
                                <div className="flex items-center justify-center gap-6 md:gap-8 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden md:block shrink-0">
                                        Découvrir aussi
                                    </span>
                                    {orchestras.slice(1).map((orch) => (
                                        <a
                                            key={orch.id}
                                            href={`#${orch.id}`}
                                            className="group flex items-center gap-3 pr-4 pl-2 py-1.5 rounded-full bg-slate-50 border border-slate-200 hover:bg-teal-50 hover:border-teal-200 transition-all duration-300 shrink-0"
                                        >
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                 <img
                                                    src={orch.photo_url?.startsWith('http') ? orch.photo_url : (orch.photo_url ? `${BASE_URL}${orch.photo_url}` : "https://via.placeholder.com/150")}
                                                    alt={orch.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700 group-hover:text-teal-700 whitespace-nowrap">
                                                {orch.name}
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. Other Orchestras List */}
                    <section className="bg-slate-50 py-24 pb-48">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="space-y-48">
                                {orchestras.slice(1).map((orch, index) => {
                                    const isEven = index % 2 === 0;
                                    return (
                                        <div key={orch.id} id={orch.id} className="scroll-mt-20">
                                            <div className={`flex flex-col md:flex-row gap-12 lg:gap-24 items-center ${!isEven ? 'md:flex-row-reverse' : ''}`}>

                                                {/* Image (Multi-Photos Interactive Stack) */}
                                                <div className="w-full md:w-1/2 group perspective-1000">
                                                    <div className="relative w-full max-w-[500px] mx-auto">
                                                        <div className={`absolute -inset-4 bg-gradient-to-tr ${isEven ? 'from-indigo-500 to-purple-500' : 'from-blue-500 to-cyan-500'} rounded-2xl opacity-20 blur-xl group-hover:opacity-40 transition-opacity`}></div>

                                                        {/* Unified PhotoStack Component */}
                                                        <PhotoStack
                                                            photos={orch.photos && orch.photos.length > 0 ? orch.photos : [{ id: 'default', photo_url: orch.photo_url || "", display_order: 0 }]}
                                                            altPrefix={orch.name}
                                                            height="h-[400px]"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Text */}
                                                <div className="w-full md:w-1/2 space-y-8">
                                                    <div className="space-y-4">
                                                        <h3 className="text-4xl lg:text-5xl font-bold text-slate-900 font-poppins leading-tight">
                                                            {orch.name}
                                                        </h3>
                                                        <div className={`h-1.5 w-20 ${isEven ? 'bg-indigo-500' : 'bg-blue-500'} rounded-full`}></div>
                                                    </div>

                                                    <div className="text-lg text-slate-600 leading-relaxed text-justify">
                                                        {orch.description}
                                                    </div>


                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
};

export default Orchestras;
