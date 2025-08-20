import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, FileText, Music, Users, Search, X, Filter, Download, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Morceau {
  id: string;
  nom: string;
  compositeur: string | null;
  arrangement: string | null;
  created_at: string;
  orchestras: Array<{
    id: string;
    name: string;
  }>;
  partitions: Partition[];
}

interface Partition {
  id: string;
  voice: string | null;
  file_name: string;
  file_path: string;
  file_type: 'pdf' | 'image';
  file_size: number;
  mime_type: string;
  created_at: string;
  instrument: {
    id: string;
    name: string;
  };
}

interface Orchestra {
  id: string;
  name: string;
}

const UserPartitions = () => {
  const { user, profile } = useAuth();
  const [morceauxWithPartitions, setMorceauxWithPartitions] = useState<Morceau[]>([]);
  const [userOrchestras, setUserOrchestras] = useState<Orchestra[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [orchestraFilter, setOrchestraFilter] = useState<string[]>([]);

  // Récupérer les orchestres de l'utilisateur
  const fetchUserOrchestras = async (userId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-orchestras?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserOrchestras(data || []);
        // Initialiser le filtre orchestre avec tous les orchestres de l'utilisateur
        setOrchestraFilter(data.map((o: Orchestra) => o.id) || []);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des orchestres:', err);
    }
  };

  // Récupérer toutes les partitions de l'utilisateur groupées par morceau
  const fetchUserPartitions = async (userId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-partitions?type=user&userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMorceauxWithPartitions(data || []);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des partitions:', err);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      Promise.all([
        fetchUserOrchestras(user.id),
        fetchUserPartitions(user.id)
      ]).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'bg-red-100 text-red-800';
      case 'image': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleOrchestraFilter = (orchestraId: string) => {
    setOrchestraFilter(prev => 
      prev.includes(orchestraId) 
        ? prev.filter(id => id !== orchestraId)
        : [...prev, orchestraId]
    );
  };

  const selectAllOrchestras = () => {
    setOrchestraFilter(userOrchestras.map(o => o.id));
  };

  const clearAllOrchestras = () => {
    setOrchestraFilter([]);
  };

  // Filtrer les morceaux
  const filteredMorceaux = morceauxWithPartitions.filter(morceau => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      morceau.nom.toLowerCase().includes(searchLower) ||
      (morceau.compositeur && morceau.compositeur.toLowerCase().includes(searchLower)) ||
      (morceau.arrangement && morceau.arrangement.toLowerCase().includes(searchLower)) ||
      morceau.partitions.some(p => 
        p.instrument.name.toLowerCase().includes(searchLower) ||
        (p.voice && p.voice.toLowerCase().includes(searchLower))
      )
    );
    
    const matchesOrchestra = orchestraFilter.length === 0 || 
      morceau.orchestras.some(o => orchestraFilter.includes(o.id));
    
    return matchesSearch && matchesOrchestra;
  });

  // Compter le total de partitions
  const totalPartitions = filteredMorceaux.reduce((total, morceau) => total + morceau.partitions.length, 0);

  if (!user) {
    return <Navigate to="/connexion" />;
  }

  return (
    <div className="font-inter pt-20 pb-20 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link
                to="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-2"
                title="Retour au dashboard"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </Link>
              <div className="bg-purple-600/10 p-3 rounded-lg">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h1 className="font-poppins font-bold text-3xl text-dark">
                  Mes Partitions
                </h1>
                <p className="font-inter text-gray-600">
                  Vos partitions organisées par morceau
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-4">
            <span className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span>{totalPartitions} partition{totalPartitions > 1 ? 's' : ''} dans {filteredMorceaux.length} morceau{filteredMorceaux.length > 1 ? 'x' : ''}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{userOrchestras.length} orchestre{userOrchestras.length > 1 ? 's' : ''}</span>
            </span>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Recherche */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un morceau ou partition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 w-64"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Filtres par orchestre */}
            {userOrchestras.length > 1 && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {userOrchestras.map((orchestra) => (
                    <button
                      key={orchestra.id}
                      onClick={() => toggleOrchestraFilter(orchestra.id)}
                      className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        orchestraFilter.includes(orchestra.id)
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      <Users className="h-3 w-3" />
                      <span>{orchestra.name}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center space-x-1 text-xs">
                  <button onClick={selectAllOrchestras} className="text-purple-600 hover:text-purple-700">Tout</button>
                  <span className="text-gray-300">|</span>
                  <button onClick={clearAllOrchestras} className="text-gray-500 hover:text-gray-700">Aucun</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement de vos partitions...</p>
          </div>
        ) : filteredMorceaux.length === 0 && searchTerm ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>Aucune partition trouvée pour "{searchTerm}"</p>
            <button onClick={() => setSearchTerm('')} className="text-purple-600 hover:text-purple-700 mt-2">Effacer la recherche</button>
          </div>
        ) : morceauxWithPartitions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Aucune partition disponible</p>
            <p className="text-sm">Les partitions apparaîtront ici selon vos instruments et orchestres assignés.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredMorceaux.map((morceau) => (
              <div key={morceau.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-poppins font-semibold text-xl text-dark flex items-center space-x-2">
                        <Music className="h-6 w-6 text-purple-600" />
                        <span>{morceau.nom}</span>
                      </h2>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                        {morceau.compositeur && (
                          <span>Compositeur : {morceau.compositeur}</span>
                        )}
                        {morceau.arrangement && (
                          <span>Arrangement : {morceau.arrangement}</span>
                        )}
                      </div>
                      {morceau.orchestras && morceau.orchestras.length > 0 && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                          <Users className="h-3 w-3" />
                          <span>{morceau.orchestras.map(o => o.name).join(', ')}</span>
                        </div>
                      )}
                    </div>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      {morceau.partitions.length} partition{morceau.partitions.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {morceau.partitions.map((partition) => (
                    <div key={partition.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="bg-purple-600/10 p-3 rounded-lg">
                            <FileText className="h-6 w-6 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Music className="h-3 w-3 mr-1" />
                                {partition.instrument.name}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFileTypeColor(partition.file_type)}`}>
                                {partition.file_type.toUpperCase()}
                              </span>
                            </div>
                            
                            {partition.voice && (
                              <p className="text-sm text-gray-600 mb-2">
                                Voie : {partition.voice}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                              <span className="flex items-center space-x-1">
                                <FileText className="h-4 w-4" />
                                <span>{partition.file_name}</span>
                              </span>
                              <span>
                                Ajouté le {formatDate(partition.created_at)}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-400">
                                {(partition.file_size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => window.open(partition.file_path, '_blank')}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200"
                            title="Voir la partition"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <a
                            href={partition.file_path}
                            download={partition.file_name}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="Télécharger"
                          >
                            <Download className="h-5 w-5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Message si aucune partition après filtrage */}
            {filteredMorceaux.length === 0 && morceauxWithPartitions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p>Aucune partition ne correspond aux filtres sélectionnés</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPartitions;