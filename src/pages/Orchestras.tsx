import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Music, X, ZoomIn } from 'lucide-react';
import PageHero from '../components/PageHero';
import { getOptimizedImageUrl, getImageSrcSet } from '../utils/image';
import { useSEO } from '../utils/seo';

interface Orchestra {
    id: string;
    name: string;
    description: string | null;
    photo_url: string | null;
    photos?: { id: string; photo_url: string; display_order: number }[];
}

import { API_URL, BASE_URL } from '../config';

const SmoothFadeImage = ({ src, srcSet, sizes, alt, className = '' }: { src: string; srcSet?: string; sizes?: string; alt: string; className?: string }) => {
    const [loaded, setLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
            setLoaded(true);
        }
    }, [src]);

    return (
        <div className="relative w-full h-full bg-slate-900/5 overflow-hidden">
            <img
                ref={imgRef}
                src={src}
                srcSet={srcSet}
                sizes={sizes}
                alt={alt}
                loading="lazy"
                decoding="async"
                onLoad={() => setLoaded(true)}
                className={`${className} transition-opacity duration-300 ease-out ${loaded ? 'opacity-100' : 'opacity-0'}`}
            />
        </div>
    );
};

const PhotoStack = ({ 
    photos, 
    altPrefix, 
    aspectRatio = "aspect-[16/10]" 
}: { 
    photos: { id: string; photo_url: string; display_order: number }[]; 
    altPrefix: string; 
    aspectRatio?: string;
}) => {
    const [stack, setStack] = useState(photos);
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

    useEffect(() => {
        setStack(photos);
    }, [photos]);

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

    const bringToFront = (index: number) => {
        if (index === 0) return;
        const newStack = [...stack];
        const [movedPhoto] = newStack.splice(index, 1);
        newStack.unshift(movedPhoto);
        setStack(newStack);
    };

    if (!photos || photos.length === 0) return null;

    return (
        <>
            {photos.length === 1 ? (
                <div 
                    onClick={() => setPreviewPhoto(photos[0].photo_url)}
                    className={`relative rounded-2xl overflow-hidden shadow-xl border-4 border-white ${aspectRatio} w-full bg-slate-100 cursor-pointer group`}
                >
                    <SmoothFadeImage
                        src={getOptimizedImageUrl(photos[0].photo_url, 1000, 85)}
                        srcSet={getImageSrcSet(photos[0].photo_url)}
                        sizes="(max-width: 768px) 100vw, 600px"
                        alt={altPrefix}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors duration-300 flex items-center justify-center pointer-events-none">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur-sm text-white px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 shadow-lg border border-white/20">
                            <ZoomIn className="w-3.5 h-3.5 text-teal-400" />
                            <span>Agrandir</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={`relative ${aspectRatio} w-full`}>
                    {stack.slice(0, 2).map((photo, i) => (
                        <div
                            key={photo.id}
                            className={`absolute top-0 left-0 w-full h-full ${i === 0 ? 'z-20 cursor-pointer group' : 'z-10 cursor-pointer'}`}
                            style={{
                                transform: i === 0 ? 'none' : 'rotate(2.5deg) translate(8px, 8px)',
                                opacity: i === 0 ? 1 : 0.85
                            }}
                            onClick={() => {
                                if (i === 0) {
                                    setPreviewPhoto(photo.photo_url);
                                } else {
                                    bringToFront(i);
                                }
                            }}
                        >
                            <div className="relative rounded-2xl overflow-hidden shadow-xl border-4 border-white h-full bg-slate-100">
                                <SmoothFadeImage
                                    src={getOptimizedImageUrl(photo.photo_url, 1000, 85)}
                                    srcSet={getImageSrcSet(photo.photo_url)}
                                    sizes="(max-width: 768px) 100vw, 600px"
                                    alt={`${altPrefix} - ${photo.display_order}`}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                {i === 0 && (
                                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors duration-300 flex items-center justify-center pointer-events-none">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur-sm text-white px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 shadow-lg border border-white/20">
                                            <ZoomIn className="w-3.5 h-3.5 text-teal-400" />
                                            <span>Agrandir</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Lightbox Plein Écran */}
            {previewPhoto && (
                <div 
                    className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
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
                            alt={altPrefix} 
                            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                        />
                    </div>
                </div>
            )}
        </>
    );
};

const ORCHESTRAS_CACHE_KEY = 'lyre_cached_orchestras_v1';

const Orchestras = () => {
    useSEO({
        title: "Nos Orchestres & Ensembles Musicaux",
        description: "Les orchestres et ensembles de La Lyre de Chalindrey : Grand Orchestre d'Harmonie, Orchestre des Jeunes et ensembles musicaux en Haute-Marne.",
        url: '/orchestres'
    });
    const { pageHeaders } = useTheme();
    const [orchestras, setOrchestras] = useState<Orchestra[]>(() => {
        try {
            const cached = localStorage.getItem(ORCHESTRAS_CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {}
        return [];
    });
    const [loading, setLoading] = useState(() => orchestras.length === 0);

    useEffect(() => {
        const fetchOrchestras = async () => {
            try {
                const response = await fetch(`${API_URL}/public-orchestras`);
                if (response.ok) {
                    const data = await response.json();
                    setOrchestras(data);
                    try {
                        localStorage.setItem(ORCHESTRAS_CACHE_KEY, JSON.stringify(data));
                    } catch (e) {}
                }
            } catch (error) {
                console.error('Error fetching orchestras:', error);
            } finally {
                setLoading(false);
                setTimeout(() => {
                    if ((window as any).__lenis) {
                        (window as any).__lenis.resize();
                    }
                }, 100);
            }
        };

        fetchOrchestras();
    }, []);

    const scrollToSection = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            if ((window as any).__lenis) {
                (window as any).__lenis.scrollTo(element, { offset: -100 });
            } else {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <div className="text-slate-900">
            {/* Header Section */}
            <PageHero
                title={<span>Nos <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-500">Orchestres</span></span>}
                subtitle="Découvrez nos différents ensembles et rejoignez celui qui vous correspond."
                backgroundImage={pageHeaders['orchestres'] || "/orchestras-banner.webp"}
                anchors={orchestras.map((orch, index) => ({
                    label: orch.name,
                    targetId: orch.id,
                    icon: Music,
                    color: index === 0 ? 'emerald' : index === 1 ? 'rose' : index === 2 ? 'indigo' : 'cyan'
                }))}
            />

            {loading && orchestras.length === 0 ? (
                <div className="flex justify-center items-center py-32">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-500 border-t-transparent"></div>
                </div>
            ) : (
                <>
                    {/* 1. Highlight Section (First Orchestra) */}
                    {orchestras.length > 0 && (
                        <section id={orchestras[0].id} className="py-24 bg-white relative scroll-mt-20">
                            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="max-w-7xl mx-auto">

                                    {/* Title Section */}
                                    <div className="mb-16 text-center">
                                        <h2 className="font-bold text-3xl md:text-5xl text-slate-900 mb-6 relative inline-block">
                                            {orchestras[0].name}
                                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-teal-500 rounded-full"></div>
                                        </h2>
                                    </div>

                                    {/* Content with Float Layout */}
                                    <div className="prose prose-lg text-slate-600 max-w-none clearfix">
                                        {/* Image (Floated Left) */}
                                        <div className="float-none md:float-left w-full md:w-1/2 lg:w-5/12 mr-0 md:mr-16 lg:mr-24 mb-12 lg:mb-16 relative">
                                            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(20,184,166,0.15)_0%,transparent_70%)] pointer-events-none transform -rotate-12 rounded-full"></div>
                                            {/* Unified PhotoStack Component */}
                                            <PhotoStack
                                                photos={orchestras[0].photos && orchestras[0].photos.length > 0 ? orchestras[0].photos : [{ id: 'default', photo_url: orchestras[0].photo_url || "", display_order: 0 }]}
                                                altPrefix={orchestras[0].name}
                                                aspectRatio="aspect-[16/10]"
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



                    {/* 3. Other Orchestras List */}
                    <section className="bg-slate-50 py-24 pb-48">
                        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="space-y-48">
                                {orchestras.slice(1).map((orch, index) => {
                                    const isEven = index % 2 === 0;
                                    return (
                                        <div key={orch.id} id={orch.id} className="scroll-mt-20">
                                            <div className={`flex flex-col md:flex-row gap-12 lg:gap-24 items-center ${!isEven ? 'md:flex-row-reverse' : ''}`}>

                                                {/* Image (Multi-Photos Interactive Stack) */}
                                                <div className="w-full md:w-1/2 group perspective-1000">
                                                    <div className="relative w-full max-w-[500px] mx-auto">
                                                        <div className={`absolute -inset-4 ${isEven ? 'bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)]' : 'bg-[radial-gradient(circle,rgba(6,182,212,0.15)_0%,transparent_70%)]'} pointer-events-none rounded-2xl group-hover:opacity-100 transition-opacity`}></div>

                                                        {/* Unified PhotoStack Component */}
                                                        <PhotoStack
                                                            photos={orch.photos && orch.photos.length > 0 ? orch.photos : [{ id: 'default', photo_url: orch.photo_url || "", display_order: 0 }]}
                                                            altPrefix={orch.name}
                                                            aspectRatio="aspect-[16/10]"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Text */}
                                                <div className="w-full md:w-1/2 space-y-8">
                                                <div className="space-y-4">
                                                    <h2 className="font-bold text-3xl md:text-5xl text-slate-900 mb-6 relative inline-block">
                                                        {orch.name}
                                                        <div className={`absolute -bottom-4 left-0 w-16 h-1 ${isEven ? 'bg-indigo-500' : 'bg-blue-500'} rounded-full`}></div>
                                                    </h2>
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
