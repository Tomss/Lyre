import React, { useState, useEffect } from 'react';
import { Users, Award, Music } from 'lucide-react';

interface Orchestra {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
}

const School = () => {
  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [selectedOrchestra, setSelectedOrchestra] = useState<Orchestra | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchOrchestras();
  }, []);

  return (
    <div className="font-inter pt-20">
      {/* Header Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h1 className="font-poppins font-bold text-4xl md:text-5xl text-dark mb-6">
              Notre école, votre musique.
            </h1>
            <p className="font-inter text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Une formation musicale complète dans un environnement bienveillant et professionnel.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Description principale */}
            <div className="animate-fade-in mb-12">
              <p className="font-inter text-lg text-gray-700 leading-relaxed mb-8">
                L'école propose une formation musicale du niveau Éveil au niveau Supérieur, par des professeurs diplômés de Conservatoires à Rayonnement Régional ou possédant un niveau équivalent.
              </p>
              <p className="font-inter text-lg text-gray-700 leading-relaxed mb-8">
                Les cours suivent le rythme scolaire : un cours de solfège, une demi-heure d'instrument et une activité orchestrale par semaine dans l'un des orchestres suivants :
              </p>
            </div>

            {/* Section Orchestres */}
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
                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
                          selectedOrchestra?.id === orchestra.id
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {orchestra.name}
                      </button>
                    ))}
                  </div>

                  {/* Description de l'orchestre sélectionné */}
                  {selectedOrchestra && (
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-8 border border-orange-200 shadow-lg animate-fade-in">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-10 space-y-8 lg:space-y-0">
                        {/* Photo de l'orchestre */}
                        {selectedOrchestra.photo_url && (
                          <div className="lg:w-2/5 flex-shrink-0">
                            <img
                              src={selectedOrchestra.photo_url}
                              alt={selectedOrchestra.name}
                              className="w-full h-80 lg:h-64 object-cover rounded-xl shadow-xl border-4 border-white/80 hover:shadow-2xl transition-all duration-300"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Contenu textuel */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-6">
                            <div className="bg-gradient-to-br from-primary to-primary/80 p-4 rounded-xl shadow-lg">
                              <Users className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <h3 className="font-poppins font-bold text-3xl text-dark mb-1">
                                {selectedOrchestra.name}
                              </h3>
                              <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full"></div>
                            </div>
                          </div>
                          {selectedOrchestra.description ? (
                            <div className="font-inter text-gray-800 leading-relaxed text-lg whitespace-pre-line bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-white/40 shadow-sm">
                              {selectedOrchestra.description}
                            </div>
                          ) : (
                            <p className="font-inter text-gray-500 italic bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-white/40 shadow-sm">
                              Description à venir pour cet orchestre.
                            </p>
                          )}
                        </div>
                      </div>
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

            {/* Conclusion */}
            <div className="animate-fade-in">
              <p className="font-inter text-lg text-gray-700 leading-relaxed">
                Si les activités d'éveil sont ludiques, la récompense, pour les néophytes, est l'intégration progressive dans les orchestres d'élèves, jusqu'à l'accession au Grand Orchestre d'Harmonie.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center animate-fade-in">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-poppins font-semibold text-xl text-dark mb-4">
                Communauté
              </h3>
              <p className="font-inter text-gray-600">
                Une communauté musicale bienveillante et passionnée.
              </p>
            </div>
            <div className="text-center animate-fade-in">
              <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-poppins font-semibold text-xl text-dark mb-4">
                Excellence
              </h3>
              <p className="font-inter text-gray-600">
                Un enseignement de qualité adapté à chaque niveau.
              </p>
            </div>
            <div className="text-center animate-fade-in">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Music className="h-8 w-8 text-primary" />
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