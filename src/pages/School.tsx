import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Users, Sparkles, Compass, Rocket, School as SchoolIcon, Presentation, Lightbulb, Heart, Mic2, History, X, ZoomIn } from 'lucide-react';
import PageHero from '../components/PageHero';
import HistoryTimeline from '../components/HistoryTimeline';

// Interfaces (peuvent être partagées)


interface Instrument {
  id: string;
  name: string;
  teacher: string | null;
  description: string | null;
  photo_url: string | null;
}



import { API_URL, BASE_URL } from '../config';
import { getOptimizedImageUrl, getImageSrcSet } from '../utils/image';

const getInstrumentConfig = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('hautbois') || n.includes('flûte') || n.includes('clarinette') || n.includes('saxophone') || n.includes('phonium') || n.includes('trompette') || n.includes('cor') || n.includes('trombone') || n.includes('tuba') || n.includes('saxhorn')) return { color: 'teal' };
  if (n.includes('guitare') || n.includes('basse') || n.includes('contrebasse')) return { color: 'emerald' };
  if (n.includes('percussion') || n.includes('batterie')) return { color: 'fuchsia' };
  if (n.includes('eveil') || n.includes('éveil')) return { color: 'violet' };
  return { color: 'cyan' };
};

const INSTRUMENTS_CACHE_KEY = 'lyre_cached_school_instruments_v1';

const School = () => {
  const { settings, pageHeaders } = useTheme();
  const [instruments, setInstruments] = useState<Instrument[]>(() => {
    try {
      const cached = localStorage.getItem(INSTRUMENTS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [instrumentsLoading, setInstrumentsLoading] = useState(() => instruments.length === 0);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewPhoto) setPreviewPhoto(null);
        else if (selectedInstrument) setSelectedInstrument(null);
      }
    };
    if (selectedInstrument || previewPhoto) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedInstrument, previewPhoto]);

  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        const response = await fetch(`${API_URL}/public-instruments`);
        if (response.ok) {
          const data = await response.json();
          setInstruments(data || []);
          try {
            localStorage.setItem(INSTRUMENTS_CACHE_KEY, JSON.stringify(data));
          } catch (e) {}
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des instruments:', err);
      } finally {
        setInstrumentsLoading(false);
        setTimeout(() => {
          if ((window as any).__lenis) {
            (window as any).__lenis.resize();
          }
        }, 50);
      }
    };

    fetchInstruments();
  }, []);

  return (
    <div className="">
      {/* Header Section */}
      <PageHero
        title={<span>L'école de <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-500">Musique</span></span>}
        subtitle="Formation musicale, instrumentale et pratique collective pour tous les âges."
        backgroundImage={pageHeaders['school'] || "/school-banner.webp"}
        anchors={[
          { label: "Notre École", targetId: "presentation", icon: SchoolIcon, color: "teal" },
          { label: "Nos Classes & Professeurs", targetId: "classes", icon: Users, color: "emerald" },
          { label: "L'École c'est aussi...", targetId: "activites", icon: Sparkles, color: "cyan" },
          { label: "Notre Histoire", targetId: "histoire", icon: History, color: "amber" }
        ]}
      />



      {/* Main Content: Notre École Section */}
      <section id="presentation" className="scroll-mt-20 py-24 bg-white relative overflow-hidden">
        {/* Soft Background Accents - Zero GPU Cost Radial Gradients */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(204,251,241,0.4)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(207,250,254,0.4)_0%,transparent_70%)] pointer-events-none"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="font-bold text-3xl md:text-5xl text-slate-900 mb-6 relative inline-block">
                Notre École
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-teal-500 rounded-full"></div>
              </h2>
            </div>
            
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
               {/* Site Logo - Subtle Animation */}
               <div className="lg:w-1/3 flex justify-center order-2 lg:order-1">
                 <div className="relative group/logo">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] bg-[radial-gradient(circle,rgba(13,148,136,0.1)_0%,transparent_70%)] pointer-events-none"></div>
                   <div className="relative">
                       <img 
                        src={settings.secondary_logo_url?.startsWith('http') ? settings.secondary_logo_url : (settings.secondary_logo_url ? `${BASE_URL}${settings.secondary_logo_url}` : (settings.site_logo_url?.startsWith('http') ? settings.site_logo_url : (settings.site_logo_url ? `${BASE_URL}${settings.site_logo_url}` : "/lyre-logo.png")))} 
                        alt="Logo de La Lyre" 
                        className="w-56 h-56 md:w-72 md:h-72 object-contain drop-shadow-lg transition-transform duration-1000 group-hover/logo:scale-105"
                      />
                   </div>
                 </div>
               </div>

               {/* Content - Clean & Balanced */}
               <div className="lg:w-2/3 text-center lg:text-left space-y-10 order-1 lg:order-2">
                  <p className="text-base md:text-lg text-slate-600 leading-relaxed font-light">
                    L'école propose une formation musicale du <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-bold">niveau Eveil</span> au <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 font-bold">niveau fin de 2nd cycle</span>.
                    L’enseignement est dispensé par des professeurs titulaires d’un D.E. ou d’un D.N.S.P.M., diplômés de Conservatoires à Rayonnement Régional ou Supérieur, passionnés par la musique et la pédagogie.
                  </p>

                  <div className="space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 group">
                      <div className="h-px w-8 bg-blue-500/40 group-hover:w-12 group-hover:bg-blue-500 transition-all duration-500 rounded-full hidden lg:block"></div>
                      <p className="text-lg md:text-xl text-slate-800 font-medium leading-relaxed">
                        Les cours suivent le rythme scolaire : un cours de solfège, une demi-heure d’instrument et une activité orchestrale par semaine.
                      </p>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 group">
                      <div className="h-px w-8 bg-teal-500/40 group-hover:w-12 group-hover:bg-teal-500 transition-all duration-500 rounded-full hidden lg:block"></div>
                      <p className="text-lg md:text-xl text-slate-800 font-medium leading-relaxed">
                        Aux activités d’éveil ludiques, succède l’intégration progressive dans les orchestres d’élèves, jusqu’à l’accession aux rangs du <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600 font-extrabold uppercase tracking-wide">Grand Orchestre d’Harmonie</span>.
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-50 inline-block">
                    <p className="italic text-teal-700/80 text-base md:text-lg font-medium">
                      Envie de faire de la musique, de nous rencontrer ? Marie-Christine et les professeurs sont présents pour vous accueillir !
                    </p>
                  </div>
               </div>
            </div>
        </div>
      </section>

      {/* Section Classes & Professeurs (Fusionnée) */}
      <section id="classes" className="scroll-mt-20 py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-bold text-4xl md:text-5xl text-white mb-6">
              Nos Classes & Professeurs
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full mx-auto shadow-sm shadow-teal-500/30"></div>
          </div>

          {instrumentsLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {[
                ...instruments,
                // Fallback for Formation Musicale if not present in DB
                ...(!instruments.some(i => i.name.toLowerCase().includes('formation')) ? [{
                  id: 'fm-manual',
                  name: "Formation Musicale",
                  teacher: "A. Brisard, M-C. Rémongin, N. Cardot",
                  photo_url: "https://images.pexels.com/photos/4502973/pexels-photo-4502973.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                  description: "La pierre angulaire de l'apprentissage musical. Apprenez à lire, écrire et comprendre la musique dans une ambiance bienveillante."
                }] : []),
                // Fallback for Eveil Musical if not present in DB
                ...(!instruments.some(i => i.name.toLowerCase().includes('eveil') || i.name.toLowerCase().includes('éveil')) ? [{
                  id: 'eveil-manual',
                  name: "Éveil Musical",
                  teacher: "Équipe pédagogique",
                  photo_url: "https://images.pexels.com/photos/17691880/pexels-photo-17691880.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                  description: "Le monde magique de la musique : chants, mime, percussions corporelles... Une découverte ludique pour les tout-petits !"
                }] : [])
              ].map((inst, idx) => {
                return (
                  <div
                    key={inst.id || idx}
                    className={`group relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden hover:border-teal-400 transition-colors duration-150 cursor-pointer ${inst.name.toLowerCase().includes('formation') || inst.name.toLowerCase().includes('eveil') || inst.name.toLowerCase().includes('éveil') ? 'md:col-span-2 lg:col-span-1 xl:col-span-2' : ''}`}
                    onClick={() => setSelectedInstrument(inst)}
                  >
                    {/* Image Background */}
                    {inst.photo_url && (
                      <div className="absolute inset-0 z-0 overflow-hidden">
                         <img
                          src={getOptimizedImageUrl(inst.photo_url, 600, 80)}
                          alt={inst.name}
                          loading="eager"
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-40 pointer-events-none"
                          onError={(e) => {
                            // @ts-ignore
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent pointer-events-none"></div>
                      </div>
                    )}

                    <div className="p-6 relative z-10 flex flex-col h-full min-h-[220px]">
                      <h3 className="font-bold text-2xl text-white mb-2 group-hover:text-teal-300 transition-colors">
                        {inst.name}
                      </h3>

                      <div className="mt-auto pt-6 border-t border-white/10 flex items-center gap-3">
                        <div className="shrink-0 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-white/20 shadow-sm">
                          <Users className="w-5 h-5 text-teal-400" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs text-teal-400 uppercase tracking-wide font-bold mb-0.5">Professeur</p>
                          <p className="text-sm font-medium text-white/95 truncate">{inst.teacher || "Professeur à confirmer"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Instrument */}
          {selectedInstrument && (
            <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center z-[1000] p-3 sm:p-6 overflow-hidden animate-in fade-in duration-300">
                <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[82vh] sm:max-h-[85vh] overflow-y-auto border border-white/10 relative my-auto" data-lenis-modal onClick={(e) => e.stopPropagation()}>
                    {/* Header/Image - Full Width Edge-to-Edge */}
                    <div 
                      className={`w-full h-64 sm:h-80 md:h-96 relative bg-slate-900 flex-shrink-0 overflow-hidden ${selectedInstrument.photo_url ? 'cursor-pointer group' : ''}`}
                      onClick={() => {
                        if (selectedInstrument.photo_url) setPreviewPhoto(selectedInstrument.photo_url);
                      }}
                    >
                         {selectedInstrument.photo_url ? (
                            <>
                              <img 
                                src={getOptimizedImageUrl(selectedInstrument.photo_url, 1200, 85)} 
                                alt={selectedInstrument.name} 
                                loading="eager"
                                decoding="async"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                              />
                              <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors duration-300 flex items-center justify-center pointer-events-none">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 shadow-lg border border-white/20">
                                      <ZoomIn className="w-3.5 h-3.5 text-teal-400" />
                                      <span>Agrandir</span>
                                  </div>
                              </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-teal-400">
                                <Sparkles className="h-16 w-16 mb-4 opacity-50" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent pointer-events-none"></div>
                        
                        {/* Bouton Fermeture */}
                        <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInstrument(null);
                            }}
                            className="absolute top-4 right-4 w-10 h-10 bg-slate-900/80 hover:bg-slate-900 rounded-full text-white flex items-center justify-center transition-colors border border-white/20 z-20"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Contenu */}
                    <div className="p-8 sm:p-10 text-white">
                        <h2 className="font-bold text-2xl sm:text-3xl text-white mb-6 leading-tight">
                            {selectedInstrument.name}
                        </h2>

                        <div className="flex flex-col sm:flex-row gap-6 mb-8 p-4 bg-slate-800 rounded-2xl border border-white/10">
                            <div className="flex items-center text-teal-200 font-medium">
                                <Users className="w-5 h-5 mr-3 text-teal-400" />
                                Professeur(s) : <span className="text-white ml-2">{selectedInstrument.teacher || "À confirmer"}</span>
                            </div>
                        </div>

                        {selectedInstrument.description ? (
                            <div className="prose prose-invert prose-teal max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {selectedInstrument.description}
                            </div>
                        ) : (
                            <p className="text-slate-400 italic">Aucune description détaillée n'est disponible pour cette classe actuellement.</p>
                        )}
                    </div>
                </div>
                {/* Overlay Click to Close */}
                <div className="absolute inset-0 -z-10" onClick={() => setSelectedInstrument(null)}></div>
            </div>
          )}

          {/* Modal Lightbox Plein Écran Instrument */}
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
                          alt="Photo instrument" 
                          className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                      />
                  </div>
              </div>
          )}
        </div>
      </section>

      {/* 2. Feature Grid (following immediately) */}
      <section id="activites" className="scroll-mt-20 py-20 bg-white relative">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-bold text-4xl md:text-5xl text-slate-800 mb-6">L'École c'est aussi...</h2>
            <div className="h-1 w-24 bg-teal-500 rounded-full mx-auto"></div>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "L’Atelier Eveil Musical",
                  desc: "Le monde magique de la musique : chants, mime, percussions corporelles... Une découverte ludique !",
                  icon: Sparkles,
                  color: "teal"
                },
                {
                  title: "La Classe découverte",
                  desc: "Un trimestre pour essayer concrètement tous les instruments et choisir celui qui fait vibrer votre cœur.",
                  icon: Compass,
                  color: "indigo"
                },
                {
                  title: "Stage Perfectionnement",
                  desc: "5 jours intenses, deux orchestres, un concert final. Sortez de votre zone de confort !",
                  icon: Rocket,
                  color: "rose"
                },
                {
                  title: "Orchestre à l'Ecole",
                  desc: "Une classe entière découvre la musique et monte un orchestre à l'école élémentaire.",
                  icon: SchoolIcon,
                  color: "cyan"
                },
                {
                  title: "Interventions Scolaires",
                  desc: "Un professeur présente son instrument et monte un spectacle avec une classe.",
                  icon: Presentation,
                  color: "orange"
                },
                {
                  title: "Le Projet d’Ecole",
                  desc: "Tous les élèves mobilisés autour d'un thème commun pour un grand spectacle annuel.",
                  icon: Lightbulb,
                  color: "emerald"
                },
                {
                  title: "Musique en famille",
                  desc: "Un adulte et un enfant débutent ensemble. Un cheminement commun et un partage à la maison.",
                  icon: Heart,
                  color: "violet"
                },
                {
                  title: "Les Auditions",
                  desc: "Noël et Estival : deux temps forts pour présenter ses progrès sur scène.",
                  icon: Mic2,
                  color: "amber"
                }
              ].map((item, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-teal-100/40 transition-all duration-300 hover:-translate-y-1 group">
                  <div className={`w-12 h-12 rounded-xl bg-${item.color}-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>


      {/* Notre Histoire */}
      <section id="histoire" className="scroll-mt-28">
        <HistoryTimeline />
      </section>      {/* Fin de la page */}
    </div>
  );
};

export default School;
