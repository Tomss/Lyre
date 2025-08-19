import React, { useState, useEffect } from 'react';
import { Users, Award, Music } from 'lucide-react';

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
    <div className="font-inter pt-20">
      {/* Header Section */}
      <section className="relative py-20 bg-cover bg-center bg-no-repeat bg-gray-900" 
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
              <p className="font-inter text-lg text-white/90 leading-relaxed mb-8">
                L'école propose une formation musicale du niveau Éveil au niveau Supérieur, par des professeurs diplômés de Conservatoires à Rayonnement Régional ou possédant un niveau équivalent.
              </p>
              <p className="font-inter text-lg text-white/90 leading-relaxed mb-8">
                Les cours suivent le rythme scolaire : un cours de solfège, une demi-heure d'instrument et une activité orchestrale par semaine dans l'un des orchestres suivants
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Orchestres */}
      <section className="py-16 bg-gradient-to-br from-blue-25 via-indigo-25 to-purple-25">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 animate-fade-in">
              <h2 className="font-poppins font-bold text-3xl md:text-4xl text-dark mb-4">
                Nos Orchestres
              </h2>
              <p className="font-inter text-lg text-gray-600 max-w-2xl mx-auto">
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
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
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
                        <div className="font-inter text-gray-800 leading-relaxed text-lg whitespace-pre-line max-w-4xl mx-auto text-center">
                          {selectedOrchestra.description}
                        </div>
                      ) : (
                        <p className="font-inter text-gray-500 italic text-center max-w-2xl mx-auto">
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

      {/* Section Instruments */}
      <section className="py-16 bg-gradient-to-br from-slate-25 via-gray-25 to-blue-25">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-dark mb-4">
              Nos classes d'instruments
            </h2>
            <p className="font-inter text-lg text-gray-600 max-w-2xl mx-auto">
              Découvrez nos enseignements instrumentaux avec nos professeurs qualifiés
            </p>
          </div>

          {instrumentsLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-gray-600">Chargement des instruments...</p>
            </div>
          ) : instruments.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-3 animate-fade-in max-w-6xl mx-auto">
              {instruments.map((instrument) => (
                <div key={instrument.id} className="w-36 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200/50 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
                  {/* Photo de l'instrument */}
                  <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-2">
                    {instrument.photo_url ? (
                      <img
                        src={instrument.photo_url}
                        alt={instrument.name}
                        className="w-full h-full object-cover rounded group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // En cas d'erreur, afficher l'icône par défaut
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="hidden w-full h-full items-center justify-center"
                      style={{ display: instrument.photo_url ? 'none' : 'flex' }}
                    >
                      <Music className="h-16 w-16 text-gray-400 group-hover:text-primary transition-colors duration-300" />
                    </div>
                  </div>
                  
                  {/* Contenu */}
                  <div className="p-2">
                    <h3 className="font-poppins font-semibold text-xs text-dark mb-0.5 group-hover:text-slate-700 transition-colors duration-300 text-center">
                      {instrument.name}
                    </h3>
                    
                    {instrument.teacher && (
                      <div className="text-center mb-0.5">
                        <span className="text-xs text-slate-600 font-medium">
                          {instrument.teacher}
                        </span>
                      </div>
                    )}
                    
                    {instrument.description && (
                      <p className="text-xs text-slate-500 leading-tight line-clamp-1 text-center truncate">
                        {instrument.description}
                      </p>
                    )}
                    
                    {!instrument.teacher && !instrument.description && (
                      <p className="text-xs text-slate-400 italic text-center">
                        Informations à venir
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 animate-fade-in">
              <Music className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-gray-600 text-lg">Aucun instrument disponible pour le moment.</p>
            </div>
          )}
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
              <p className="font-inter text-gray-600">
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
              <p className="font-inter text-gray-600">
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
              <p className="font-inter text-gray-600">
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