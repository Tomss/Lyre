import React, { useState, useEffect } from 'react';
import { Users, Award, Music } from 'lucide-react';
import MusicalNotesBackground from '../components/MusicalNotesBackground';

interface Orchestra {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
}

interface Instrument {
  id: string;
  name: string;
  teacher: string | null;
  description: string | null;
  photo_url: string | null;
}

const School = () => {
  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [selectedOrchestra, setSelectedOrchestra] = useState<Orchestra | null>(null);
  const [loading, setLoading] = useState(true);
  const [instrumentsLoading, setInstrumentsLoading] = useState(true);

  // Récupérer tous les orchestres
  const fetchOrchestras = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-orchestras`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrchestras(data || []);
        
        // Sélectionner l'orchestre d'harmonie par défaut (ou le premier si pas trouvé)
        const harmonieOrchestra = data.find((o: Orchestra) => 
          o.name.toLowerCase().includes('harmonie')
        );
        setSelectedOrchestra(harmonieOrchestra || data[0] || null);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des orchestres:', err);
    }
    setLoading(false);
  };

  // Récupérer tous les instruments
  const fetchInstruments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-instruments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInstruments(data || []);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des instruments:', err);
    }
    setInstrumentsLoading(false);
  };

  useEffect(() => {
    fetchOrchestras();
    fetchInstruments();
  }, []);

  return (
    <div className="font-inter">
      <MusicalNotesBackground />
      {/* Header Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat bg-gray-900" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop")` 
        }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto animate-fade-in relative z-10">
            <h1 className="font-poppins font-bold text-4xl md:text-5xl text-white mb-8 text-center">
              L'école de musique
            </h1>
            
            {/* Description principale */}
            <div className="mb-12">
              <p className="font-inter text-base text-white/90 leading-relaxed mb-8">
                L'école propose une formation musicale du niveau Éveil au niveau Supérieur, par des professeurs diplômés de Conservatoires à Rayonnement Régional ou possédant un niveau équivalent.
              </p>
              <p className="font-inter text-base text-white/90 leading-relaxed mb-8">
                Les cours suivent le rythme scolaire : un cours de solfège, une demi-heure d'instrument et une activité orchestrale par semaine dans l'un des orchestres suivants
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Instruments */}
      <section className="py-20 bg-gradient-to-br from-gray-800 via-slate-800 to-gray-900 relative overflow-hidden">
        {/* Particules d'arrière-plan */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-orange-400/15 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Notes de musique dorées pour la section Instruments */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => {
            const notes = ['♪', '♫', '♬', '♩', '♭', '♯', '𝄞', '𝄢'];
            const note = notes[i % notes.length];
            const delay = i * 1.1;
            const left = 2 + (i * 4.8) % 96;
            const top = 4 + (i * 4.5) % 92;
            const size = 16 + Math.random() * 12;
            const rotation = Math.random() * 360;
            
            return (
              <div
                key={i}
                className="absolute text-amber-300/15 animate-pulse select-none"
                style={{
                  fontSize: `${size}px`,
                  left: `${left}%`,
                  top: `${top}%`,
                  transform: `rotate(${rotation}deg)`,
                  animationDelay: `${delay}s`,
                  animationDuration: '4.2s',
                  textShadow: '0 0 15px rgba(252, 211, 77, 0.5)'
                }}
              >
                {note}
              </div>
            );
          })}
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in relative z-10">
            <div className="inline-block mb-6">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-orange-400"></div>
                <Music className="h-8 w-8 text-orange-400 animate-pulse" />
                <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-orange-400"></div>
              </div>
            </div>
            <h2 className="font-poppins font-bold text-5xl md:text-6xl text-white mb-6 bg-gradient-to-r from-orange-200 via-amber-200 to-orange-200 bg-clip-text text-transparent">
              Nos classes d'instruments
            </h2>
            <p className="font-inter text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Découvrez nos enseignements instrumentaux avec nos professeurs qualifiés dans un environnement d'exception
            </p>
          </div>

          {instrumentsLoading ? (
            <div className="text-center py-12 relative z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-400/30 border-t-amber-400 mx-auto mb-4"></div>
              <p className="text-gray-300 text-xl">Chargement de nos instruments...</p>
            </div>
          ) : instruments.length > 0 ? (
            <div className="relative z-10">
              {/* Grille hexagonale innovante */}
              <div className="flex flex-wrap justify-center gap-16 max-w-6xl mx-auto">
              {instruments.map((instrument, index) => (
                <div 
                  key={instrument.id} 
                  className="group relative animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Hexagone container */}
                  <div className="relative w-40 h-40 mx-auto">
                    {/* Hexagone de fond avec effet glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400/15 to-amber-500/15 rounded-3xl transform rotate-45 group-hover:rotate-12 transition-all duration-500 group-hover:scale-110 shadow-lg group-hover:shadow-orange-400/20"></div>
                    
                    {/* Hexagone principal */}
                    <div className="absolute inset-2 bg-gradient-to-br from-white via-orange-50 to-amber-50 rounded-2xl transform rotate-45 group-hover:rotate-12 transition-all duration-500 shadow-xl group-hover:shadow-2xl">
                      {/* Contenu de l'instrument */}
                      <div className="absolute inset-0 flex items-center justify-center transform -rotate-45 group-hover:-rotate-12 transition-all duration-500 p-4">
                    {instrument.photo_url ? (
                      <img
                        src={instrument.photo_url}
                        alt={instrument.name}
                            className="w-20 h-20 object-cover rounded-xl group-hover:scale-110 transition-all duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                        <div 
                          className="hidden w-20 h-20 items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl"
                      style={{ display: instrument.photo_url ? 'none' : 'flex' }}
                    >
                          <Music className="h-10 w-10 text-orange-600 group-hover:text-orange-700 transition-colors duration-500" />
                    </div>
                      </div>
                    </div>
                    
                    {/* Effet de brillance au survol */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rounded-3xl transform rotate-45 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  
                  {/* Informations sous l'hexagone */}
                  <div className="mt-6 text-center">
                    <h3 className="font-poppins font-bold text-xl text-white mb-2 group-hover:text-orange-200 transition-colors duration-300">
                      {instrument.name}
                    </h3>
                    
                    {instrument.teacher && (
                      <div className="mb-2">
                        <span className="text-sm text-orange-300 font-semibold">
                          {instrument.teacher}
                        </span>
                      </div>
                    )}
                    
                    {instrument.description && (
                      <p className="text-sm text-gray-400 leading-tight line-clamp-2 max-w-32 mx-auto">
                        {instrument.description.length > 50 
                          ? `${instrument.description.substring(0, 50)}...` 
                          : instrument.description
                        }
                      </p>
                    )}
                    
                    {!instrument.teacher && !instrument.description && (
                      <p className="text-sm text-gray-500 italic">
                        Informations à venir
                      </p>
                    )}
                  </div>
                  
                  {/* Effet de particules au survol */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="flex space-x-1">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 h-1 bg-orange-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              </div>
              
              {/* Message d'encouragement */}
              <div className="text-center mt-16 animate-fade-in">
                <div className="bg-gradient-to-r from-orange-900/20 via-amber-900/20 to-orange-900/20 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto border border-orange-400/15">
                  <h3 className="font-poppins font-bold text-xl text-orange-200 mb-4">
                    🎵 Trouvez votre instrument !
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Chaque instrument a sa propre personnalité. Laissez-vous guider par votre cœur et découvrez celui qui résonnera avec votre âme musicale.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 animate-fade-in relative z-10">
              <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 text-xl">Aucun instrument disponible pour le moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Section Orchestres */}
      <section className="py-16 bg-gradient-to-br from-blue-25 via-indigo-25 to-purple-25">
        {/* Notes de musique violettes pour la section Orchestres */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(17)].map((_, i) => {
            const notes = ['♪', '♫', '♬', '♩', '♭', '♯', '𝄞', '𝄢', '𝄡'];
            const note = notes[i % notes.length];
            const delay = i * 1.4;
            const left = 3 + (i * 5.7) % 94;
            const top = 7 + (i * 5.2) % 86;
            const size = 15 + Math.random() * 10;
            const rotation = Math.random() * 360;
            
            return (
              <div
                key={i}
                className="absolute text-indigo-400/16 animate-bounce select-none"
                style={{
                  fontSize: `${size}px`,
                  left: `${left}%`,
                  top: `${top}%`,
                  transform: `rotate(${rotation}deg)`,
                  animationDelay: `${delay}s`,
                  animationDuration: '3.2s',
                  textShadow: '0 0 10px rgba(129, 140, 248, 0.4)'
                }}
              >
                {note}
              </div>
            );
          })}
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 animate-fade-in">
              <h2 className="font-poppins font-bold text-5xl md:text-6xl text-dark mb-6">
                Nos Orchestres
              </h2>
              <p className="font-inter text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Découvrez nos différents ensembles musicaux
              </p>
            </div>

            <div className="animate-fade-in mb-12">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement des orchestres...</p>
                </div>
              ) : orchestras.length > 0 ? (
                <>
                  {/* Boutons des orchestres */}
                  <div className="flex flex-wrap justify-center gap-4 mb-8">
                    {orchestras.map((orchestra) => (
                      <button
                        key={orchestra.id}
                        onClick={() => setSelectedOrchestra(orchestra)}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                          selectedOrchestra?.id === orchestra.id
                            ? 'bg-gradient-to-r from-amber-700 to-yellow-800 text-white shadow-lg'
                            : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white shadow-md border border-white/50'
                        }`}
                      >
                        {orchestra.name}
                      </button>
                    ))}
                  </div>

                  {/* Description de l'orchestre sélectionné */}
                  {selectedOrchestra && (
                    <div className="animate-fade-in">
                      {/* Titre centré */}
                      <div className="text-center mb-8">
                        <h3 className="font-poppins font-bold text-3xl text-dark mb-2">
                          {selectedOrchestra.name}
                        </h3>
                        <div className="h-1 w-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mx-auto mb-6"></div>
                      </div>
                      
                      {/* Photo centrée */}
                      {selectedOrchestra.photo_url && (
                        <div className="text-center mb-8">
                          <img
                            src={selectedOrchestra.photo_url}
                            alt={selectedOrchestra.name}
                            className="max-w-md w-full h-64 object-cover rounded-xl shadow-xl border-4 border-white hover:shadow-2xl transition-all duration-300 mx-auto"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Description directe */}
                      {selectedOrchestra.description ? (
                        <div className="font-inter text-gray-800 leading-relaxed text-base whitespace-pre-line max-w-4xl mx-auto text-center">
                          {selectedOrchestra.description}
                        </div>
                      ) : (
                        <p className="font-inter text-sm text-gray-500 italic text-center max-w-2xl mx-auto">
                          Description à venir pour cet orchestre.
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun orchestre disponible pour le moment.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-gradient-to-br from-rose-25 via-pink-25 to-orange-25">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center animate-fade-in">
              <div className="bg-gradient-to-br from-rose-400 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-poppins font-semibold text-xl text-dark mb-4">
                Communauté
              </h3>
              <p className="font-inter text-sm text-gray-600">
                Une communauté musicale bienveillante et passionnée.
              </p>
            </div>
            <div className="text-center animate-fade-in">
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-poppins font-semibold text-xl text-dark mb-4">
                Excellence
              </h3>
              <p className="font-inter text-sm text-gray-600">
                Un enseignement de qualité adapté à chaque niveau.
              </p>
            </div>
            <div className="text-center animate-fade-in">
              <div className="bg-gradient-to-br from-purple-400 to-indigo-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Music className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-poppins font-semibold text-xl text-dark mb-4">
                Passion
              </h3>
              <p className="font-inter text-sm text-gray-600">
                La musique au cœur de notre pédagogie quotidienne.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default School;