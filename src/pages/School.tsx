import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Users, Sparkles, Compass, Rocket, School as SchoolIcon, Presentation, Lightbulb, Heart, Mic2, History, X } from 'lucide-react';
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



import { API_URL } from '../config';

const getInstrumentConfig = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('hautbois') || n.includes('flûte') || n.includes('clarinette') || n.includes('saxophone') || n.includes('phonium') || n.includes('trompette') || n.includes('cor') || n.includes('trombone') || n.includes('tuba') || n.includes('saxhorn')) return { color: 'teal' };
  if (n.includes('guitare') || n.includes('basse') || n.includes('contrebasse')) return { color: 'emerald' };
  if (n.includes('percussion') || n.includes('batterie')) return { color: 'fuchsia' };
  if (n.includes('eveil') || n.includes('éveil')) return { color: 'violet' };
  return { color: 'cyan' };
};

const School = () => {
  const { pageHeaders } = useTheme();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [instrumentsLoading, setInstrumentsLoading] = useState(true);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);

  useEffect(() => {
    if (selectedInstrument) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedInstrument]);

  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        const response = await fetch(`${API_URL}/public-instruments`);
        if (response.ok) {
          const data = await response.json();
          setInstruments(data || []);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des instruments:', err);
      } finally {
        setInstrumentsLoading(false);
      }
    };

    fetchInstruments();
  }, []);

  return (
    <div className="font-inter">
      {/* Header Section */}
      <PageHero
        title={<span>L'école de <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-500">Musique</span></span>}
        subtitle="Formation musicale, instrumentale et pratique collective pour tous les âges."
        backgroundImage={pageHeaders['school'] || "https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"}
        anchors={[
          { label: "Notre École", targetId: "presentation", icon: SchoolIcon, color: "teal" },
          { label: "Nos Classes & Professeurs", targetId: "classes", icon: Users, color: "emerald" },
          { label: "L'École c'est aussi...", targetId: "activites", icon: Sparkles, color: "cyan" },
          { label: "Notre Histoire", targetId: "histoire", icon: History, color: "amber" }
        ]}
      />



      {/* Main Content: Text + Features Grid */}
      <section id="presentation" className="scroll-mt-20 py-20 bg-slate-50 border-b border-slate-100 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center mb-12 animate-on-scroll">
              <h2 className="text-3xl md:text-5xl font-poppins font-bold text-slate-800 mb-6 relative inline-block">
                Notre École
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-1 bg-teal-500 rounded-full"></div>
              </h2>
            </div>
            
            <div className="max-w-3xl mx-auto text-center space-y-8 animate-on-scroll">
               <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
                  L'école propose une formation musicale du <strong className="font-semibold text-slate-800">niveau Eveil</strong> au <strong className="font-semibold text-slate-800">niveau fin de 2nd cycle</strong>.
                  L’enseignement est dispensé par des professeurs titulaires d’un D.E. ou d’un D.N.S.P.M., diplômés de Conservatoires à Rayonnement Régional ou Supérieur, passionnés par la musique et la pédagogie.
               </p>

               <div className="bg-white rounded-2xl p-8 md:p-12 shadow-md border border-slate-100">
                 <p className="text-lg md:text-xl text-slate-700 leading-relaxed mb-6">
                    Les cours suivent le rythme scolaire : un cours de solfège, une demi-heure d’instrument et une activité orchestrale par semaine.
                 </p>
                 <div className="w-16 h-px bg-slate-200 mx-auto my-6"></div>
                 <p className="text-lg md:text-xl text-slate-700 leading-relaxed">
                    Aux activités d’éveil ludiques, succède l’intégration progressive dans les orchestres d’élèves, jusqu’à l’accession aux rangs du <strong className="text-teal-600 uppercase tracking-wide">Grand Orchestre d’Harmonie</strong>.
                 </p>
               </div>

               <p className="italic text-teal-700 text-lg md:text-xl font-medium mt-8 pt-6 border-t border-slate-200 inline-block">
                  Envie de faire de la musique, de nous rencontrer ? Marie-Christine et les professeurs sont présents pour vous accueillir !
               </p>
            </div>
        </div>
      </section>

      {/* Section Classes & Professeurs (Fusionnée) */}
      <section id="classes" className="scroll-mt-20 py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-poppins font-bold text-4xl md:text-5xl text-white mb-6">
              Nos Classes & Professeurs
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full mx-auto shadow-[0_0_15px_rgba(20,184,166,0.5)]"></div>
            <p className="mt-6 text-teal-200 font-inter text-lg max-w-2xl mx-auto">
              L'excellence pédagogique au service de votre passion. Découvrez nos enseignements et les professeurs qui les dispensent.
            </p>
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
                const config = getInstrumentConfig(inst.name);

                return (
                  <div
                    key={inst.id || idx}
                    className={`group relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:border-teal-500/50 hover:bg-slate-800/80 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-teal-900/40 cursor-pointer ${inst.name.toLowerCase().includes('formation') || inst.name.toLowerCase().includes('eveil') || inst.name.toLowerCase().includes('éveil') ? 'md:col-span-2 lg:col-span-1 xl:col-span-2' : ''}`}
                    onClick={() => setSelectedInstrument(inst)}
                  >
                    {/* Image Background */}
                    {inst.photo_url && (
                      <div className="absolute inset-0 z-0">
                        <img
                          src={inst.photo_url}
                          alt={inst.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-50 group-hover:opacity-40 mix-blend-overlay"
                          onError={(e) => {
                            // @ts-ignore
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-${config.color}-900/20`}></div>
                      </div>
                    )}

                    {/* Background Glow (Visible if no image or subtle overlay) */}
                    <div className={`absolute -right-10 -top-10 w-32 h-32 bg-${config.color}-500/20 rounded-full blur-3xl group-hover:bg-${config.color}-400/30 transition-all duration-500 z-0`}></div>

                    <div className="p-6 relative z-10 flex flex-col h-full min-h-[220px]">


                      <h3 className="font-poppins font-bold text-2xl text-white mb-2 group-hover:text-teal-300 transition-colors drop-shadow-md">
                        {inst.name}
                      </h3>

                      <div className="mt-auto pt-6 border-t border-white/10 flex items-center gap-3">
                        <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-white/20 shadow-lg">
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
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/10" onClick={(e) => e.stopPropagation()}>
                    {/* Header/Image */}
                    <div className="relative h-64 sm:h-80 bg-slate-800 flex-shrink-0">
                        {selectedInstrument.photo_url ? (
                            <img src={selectedInstrument.photo_url} alt={selectedInstrument.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-teal-400">
                                <Sparkles className="h-16 w-16 mb-4 opacity-50" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                        
                        {/* Bouton Fermeture */}
                        <button 
                            onClick={() => setSelectedInstrument(null)}
                            className="absolute top-4 right-4 w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full text-white flex items-center justify-center transition-colors border border-white/20"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Contenu */}
                    <div className="p-8 sm:p-10 text-white">
                        <h2 className="font-poppins font-bold text-2xl sm:text-3xl text-white mb-6 leading-tight">
                            {selectedInstrument.name}
                        </h2>

                        <div className="flex flex-col sm:flex-row gap-6 mb-8 p-4 bg-slate-800/80 rounded-2xl border border-white/10">
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
        </div>
      </section>

      {/* 2. Feature Grid (following immediately) */}
      <section id="activites" className="scroll-mt-20 py-20 bg-white relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-poppins font-bold text-4xl md:text-5xl text-slate-800 mb-6">L'École c'est aussi...</h2>
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
                  <h3 className="font-poppins font-bold text-lg text-slate-800 mb-2">{item.title}</h3>
                  <p className="font-inter text-sm text-slate-500 leading-relaxed">{item.desc}</p>
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
