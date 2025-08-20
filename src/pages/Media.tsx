import React from 'react';
import { Image, Play, Camera, Music, FileText, File, Filter, Search, X } from 'lucide-react';
import MediaGallery from '../components/MediaGallery';
import MediaPreview from '../components/MediaPreview';

const Media = () => {
  const [mediaItems, setMediaItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedType, setSelectedType] = React.useState('album'); // Présélectionner Albums par défaut
  const [selectedMedia, setSelectedMedia] = React.useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = React.useState(false);

  // Récupérer tous les médias publiés
  const fetchMedia = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-media?published=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMediaItems(data || []);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des médias:', err);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchMedia();
  }, []);

  const getTypeColor = (type) => {
    switch (type) {
      case 'album': return 'bg-blue-100 text-blue-800';
      case 'enregistrement': return 'bg-green-100 text-green-800';
      case 'journal': return 'bg-yellow-100 text-yellow-800';
      case 'lyrissimot': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'album': return Camera;
      case 'enregistrement': return Music;
      case 'journal': return FileText;
      case 'lyrissimot': return Music;
      default: return Image;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'album': return 'Album';
      case 'enregistrement': return 'Enregistrement';
      case 'journal': return 'Journal';
      case 'lyrissimot': return 'Lyrissimot';
      default: return type;
    }
  };

  const selectType = (type) => {
    setSelectedType(type);
  };

  // Filtrer les médias
  const filteredMedia = mediaItems.filter(media => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      media.title.toLowerCase().includes(searchLower) ||
      (media.description && media.description.toLowerCase().includes(searchLower))
    );
    
    const matchesType = selectedType === 'all' || media.media_type === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Séparer les médias mis en avant
  const featuredMedia = filteredMedia.filter(media => media.is_featured);
  const regularMedia = filteredMedia.filter(media => !media.is_featured);

  const openGallery = (media) => {
    if (media.media_files && media.media_files.length > 0) {
      // Pour les albums : ouvrir la galerie d'images
      if (media.media_type === 'album' && media.media_files.some(f => f.file_type === 'image')) {
        setSelectedMedia(media);
        setIsGalleryOpen(true);
      }
      // Pour les enregistrements : ouvrir le lecteur audio
      else if (media.media_type === 'enregistrement' && media.media_files.some(f => f.file_type === 'audio')) {
        openAudioPlayer(media);
      }
      // Pour les journaux : ouvrir l'image ou le PDF
      else if (media.media_type === 'journal') {
        const imageFile = media.media_files.find(f => f.file_type === 'image');
        const pdfFile = media.media_files.find(f => f.file_type === 'pdf');
        
        if (imageFile) {
          setSelectedMedia(media);
          setIsGalleryOpen(true);
        } else if (pdfFile) {
          openPdfViewer(pdfFile);
        }
      }
      // Pour les lyrissimots : ouvrir le PDF
      else if (media.media_type === 'lyrissimot') {
        const pdfFile = media.media_files.find(f => f.file_type === 'pdf');
        if (pdfFile) {
          openPdfViewer(pdfFile);
        }
      }
    }
  };

  const openAudioPlayer = (media) => {
    // Créer un lecteur audio simple
    const audioFile = media.media_files.find(f => f.file_type === 'audio');
    if (audioFile) {
      const audio = new Audio(audioFile.file_path);
      audio.play().catch(err => {
        console.error('Erreur lecture audio:', err);
        // Fallback : ouvrir dans un nouvel onglet
        window.open(audioFile.file_path, '_blank');
      });
    }
  };

  const openPdfViewer = (pdfFile) => {
    // Ouvrir le PDF dans un nouvel onglet
    window.open(pdfFile.file_path, '_blank');
  };

  const oldOpenGallery = (media) => {
    if (media.media_type === 'album' && media.media_files && media.media_files.some(f => f.file_type === 'image')) {
      setSelectedMedia(media);
      setIsGalleryOpen(true);
    } else {
      console.log('Pas d\'images dans cet album:', media);
    }
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
    setSelectedMedia(null);
  };
  return (
    <div className="font-inter">
      {/* Galerie modale */}
      {selectedMedia && (
        <MediaGallery
          media={selectedMedia}
          isOpen={isGalleryOpen}
          onClose={closeGallery}
        />
      )}

      {/* Header Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat bg-gray-900" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("https://images.pexels.com/photos/164743/pexels-photo-164743.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop")` 
        }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in relative z-10">
            <h1 className="font-poppins font-bold text-4xl md:text-5xl text-white mb-6">
              Galerie de nos moments musicaux.
            </h1>
            {loading ? (
              <p className="font-inter text-lg text-white/80 max-w-2xl mx-auto">
                Chargement de nos médias...
              </p>
            ) : mediaItems.length > 0 ? (
              <p className="font-inter text-lg text-white/90 max-w-2xl mx-auto">
                Découvrez nos albums, enregistrements, articles de presse et actualités !
              </p>
            ) : (
              <p className="font-inter text-lg text-white/90 max-w-2xl mx-auto">
                Nos médias seront bientôt disponibles. Revenez nous voir !
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Filtres et recherche */}
      {mediaItems.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-blue-25 via-indigo-25 to-purple-25">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {/* Recherche */}
              <div className="relative max-w-md mx-auto mb-8">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher dans nos médias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full shadow-md placeholder-gray-500"
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

              {/* Filtres par type */}
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-xl p-2 shadow-md border border-white/50">
                  <button
                    onClick={() => selectType('all')}
                    className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedType === 'all'
                        ? 'bg-primary text-white shadow-md'
                        : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                    }`}
                  >
                    <span>Tout</span>
                  </button>
                  {[
                    { key: 'album', label: 'Albums', icon: Camera },
                    { key: 'enregistrement', label: 'Enregistrements', icon: Music },
                    { key: 'journal', label: 'Journaux', icon: FileText },
                    { key: 'lyrissimot', label: 'Lyrissimots', icon: File }
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => selectType(key)}
                      className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedType === key
                          ? 'bg-primary text-white shadow-md'
                          : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Compteur de résultats */}
              <div className="text-center mt-6">
                <div className="inline-block text-sm text-gray-600 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/50">
                  {filteredMedia.length} résultat{filteredMedia.length > 1 ? 's' : ''}
                </div>
              </div>
              
              {/* Actions rapides */}
              {(selectedType !== 'all' || searchTerm) && (
                <div className="flex items-center justify-center space-x-4 mt-4">
                  {selectedType !== 'all' && (
                    <div className="text-sm text-gray-600 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/50">
                      Filtré par : {
                        selectedType === 'album' ? 'Albums' :
                        selectedType === 'enregistrement' ? 'Enregistrements' :
                        selectedType === 'journal' ? 'Journaux' :
                        selectedType === 'lyrissimot' ? 'Lyrissimots' : ''
                      }
                    </div>
                  )}
                  
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-sm text-gray-600 hover:text-primary font-medium transition-colors flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/50 hover:bg-white/80"
                    >
                      <X className="h-3 w-3" />
                      <span>Effacer</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Médias mis en avant */}
      {featuredMedia.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-orange-25 via-amber-25 to-yellow-25 relative overflow-hidden">
          {/* Particules d'arrière-plan */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-orange-400/10 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 relative z-10">
              <div className="inline-block mb-6">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-orange-400"></div>
                  <div className="bg-gradient-to-br from-orange-400 to-amber-500 p-2 rounded-full shadow-lg">
                    <Star className="h-6 w-6 text-white animate-pulse" />
                  </div>
                  <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-orange-400"></div>
                </div>
              </div>
              <h2 className="font-poppins font-bold text-4xl md:text-5xl text-dark mb-6 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
                Médias mis en avant
              </h2>
              <p className="font-inter text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                Découvrez notre sélection de contenus exceptionnels
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
              {featuredMedia.map((media) => {
                const TypeIcon = getTypeIcon(media.media_type);
                return (
                  <div key={media.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/60 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-fade-in group relative">
                    {/* Effet de brillance au survol */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-10"></div>
                    
                    {/* Prévisualisation visuelle */}
                    <MediaPreview
                      files={media.media_files}
                      mediaType={media.media_type}
                      onClick={() => openGallery(media)}
                      className="cursor-pointer"
                    />
                    
                    <div className="p-6 relative z-10">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-gradient-to-br from-orange-400 to-amber-500 p-2 rounded-lg shadow-md">
                          <TypeIcon className="h-6 w-6 text-white" />
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(media.media_type)}`}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {getTypeLabel(media.media_type)}
                        </span>
                      </div>
                      
                      <h3 className="font-poppins font-semibold text-xl text-dark mb-3">
                        {media.title}
                      </h3>
                      
                      {media.description && (
                        <p className="font-inter text-gray-600 mb-4 text-sm leading-relaxed">
                          {media.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{media.media_files.length} fichier{media.media_files.length > 1 ? 's' : ''}</span>
                        <span>
                          {media.media_date 
                            ? new Date(media.media_date).toLocaleDateString('fr-FR')
                            : new Date(media.created_at).toLocaleDateString('fr-FR')
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Tous les médias */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900 relative overflow-hidden">
        {/* Particules d'arrière-plan */}
        <div className="absolute inset-0">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-orange-400/15 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center animate-fade-in relative z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-500 mx-auto mb-4"></div>
              <p className="text-orange-200">Chargement de nos médias...</p>
            </div>
          ) : filteredMedia.length === 0 && searchTerm ? (
            <div className="text-center animate-fade-in relative z-10">
              <div className="bg-gradient-to-br from-orange-400/20 to-amber-500/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Search className="h-12 w-12 text-orange-300" />
              </div>
              <p className="text-orange-200 mb-4 text-lg">Aucun média trouvé pour "{searchTerm}"</p>
              <button onClick={() => setSearchTerm('')} className="text-orange-400 hover:text-orange-300 font-medium bg-orange-900/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-orange-400/20 hover:bg-orange-800/40 transition-all duration-300">Effacer la recherche</button>
            </div>
          ) : regularMedia.length > 0 ? (
            <>
              {featuredMedia.length > 0 && (
                <div className="text-center mb-16 relative z-10">
                  <h2 className="font-poppins font-bold text-4xl md:text-5xl text-white mb-6 bg-gradient-to-r from-orange-200 via-amber-200 to-orange-200 bg-clip-text text-transparent">
                    Tous nos médias
                  </h2>
                  <p className="text-orange-200 text-xl">
                    Découvrez l'ensemble de notre collection
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 relative z-10">
                {regularMedia.map((media) => {
                  const TypeIcon = getTypeIcon(media.media_type);
                  return (
                    <div key={media.id} className={`rounded-2xl shadow-lg border overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-fade-in group relative ${
                      media.media_type === 'album' ? 'bg-white/95 border-blue-200/50' :
                      media.media_type === 'enregistrement' ? 'bg-white/95 border-green-200/50' :
                      media.media_type === 'journal' ? 'bg-white/95 border-yellow-200/50' :
                      media.media_type === 'lyrissimot' ? 'bg-white/95 border-purple-200/50' :
                      'bg-white/95 border-gray-200/50'
                    }`}>
                      {/* Effet de brillance au survol */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-10"></div>
                      
                      {/* Prévisualisation visuelle */}
                      <MediaPreview
                        files={media.media_files}
                        mediaType={media.media_type}
                        onClick={() => openGallery(media)}
                        className="cursor-pointer"
                      />
                      
                      <div className="p-4 relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="bg-orange-400/10 p-1.5 rounded-lg">
                            <TypeIcon className="h-4 w-4 text-orange-600" />
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(media.media_type)}`}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {getTypeLabel(media.media_type)}
                          </span>
                          {media.is_featured && (
                            <span className="text-amber-500">⭐</span>
                          )}
                        </div>
                        
                        <h3 className="font-poppins font-semibold text-lg text-dark mb-2">
                          {media.title}
                        </h3>
                        
                        {media.description && (
                          <p className="font-inter text-gray-700 mb-3 text-sm leading-relaxed line-clamp-3">
                            {media.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{media.media_files.length} fichier{media.media_files.length > 1 ? 's' : ''}</span>
                          <span>
                            {media.media_date 
                              ? new Date(media.media_date).toLocaleDateString('fr-FR')
                              : new Date(media.created_at).toLocaleDateString('fr-FR')
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : mediaItems.length === 0 ? (
            <div className="text-center animate-fade-in relative z-10">
              <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Image className="h-12 w-12 text-white" />
              </div>
              <h2 className="font-poppins font-semibold text-2xl text-white mb-4">
                Nos médias arrivent bientôt !
              </h2>
              <p className="font-inter text-orange-200 max-w-md mx-auto">
                Notre équipe travaille actuellement sur la mise en ligne de nos albums, enregistrements et actualités. 
                Revenez bientôt pour les découvrir !
              </p>
            </div>
          ) : (
            <div className="text-center animate-fade-in relative z-10">
              <div className="bg-gradient-to-br from-orange-400/20 to-amber-500/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Filter className="h-12 w-12 text-orange-300" />
              </div>
              <p className="text-orange-200 text-lg">Aucun média ne correspond aux filtres sélectionnés</p>
            </div>
          )}
        </div>
      </section>

      {/* Media Categories */}
      <section className="py-20 bg-gradient-to-br from-orange-25 via-amber-25 to-yellow-25 relative overflow-hidden">
        {/* Particules d'arrière-plan */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-orange-400/10 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 relative z-10">
            <div className="inline-block mb-6">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-orange-400"></div>
                <div className="bg-gradient-to-br from-orange-400 to-amber-500 p-2 rounded-full shadow-lg">
                  <Image className="h-6 w-6 text-white animate-pulse" />
                </div>
                <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-orange-400"></div>
              </div>
            </div>
            <h2 className="font-poppins font-bold text-4xl md:text-5xl text-dark mb-6 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
              Nos différents types de médias
            </h2>
            <p className="text-gray-700 text-xl max-w-3xl mx-auto leading-relaxed">
              Explorez nos différentes catégories de contenus musicaux et découvrez la richesse de notre école
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl text-center animate-fade-in hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group border border-white/60 relative overflow-hidden">
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="bg-gradient-to-br from-blue-400 to-indigo-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg relative z-10">
                <Camera className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="font-poppins font-semibold text-xl text-dark mb-4 relative z-10">
                Albums
              </h3>
              <p className="font-inter text-gray-700 text-sm leading-relaxed relative z-10">
                Nos albums photos et vidéos des concerts, répétitions et événements de l'école.
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl text-center animate-fade-in hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group border border-white/60 relative overflow-hidden">
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg relative z-10">
                <Music className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="font-poppins font-semibold text-xl text-dark mb-4 relative z-10">
                Enregistrements
              </h3>
              <p className="font-inter text-gray-700 text-sm leading-relaxed relative z-10">
                Écoutez nos enregistrements audio de concerts et répétitions.
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl text-center animate-fade-in hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group border border-white/60 relative overflow-hidden">
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="bg-gradient-to-br from-yellow-400 to-amber-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg relative z-10">
                <FileText className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="font-poppins font-semibold text-xl text-dark mb-4 relative z-10">
                Journaux
              </h3>
              <p className="font-inter text-gray-700 text-sm leading-relaxed relative z-10">
                "On parle de nous" - Découvrez les articles de presse sur notre école.
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl text-center animate-fade-in hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group border border-white/60 relative overflow-hidden">
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="bg-gradient-to-br from-purple-400 to-indigo-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg relative z-10">
                <File className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="font-poppins font-semibold text-xl text-dark mb-4 relative z-10">
                Lyrissimots
              </h3>
              <p className="font-inter text-gray-700 text-sm leading-relaxed relative z-10">
                Notre petit journal d'actualités avec toutes les nouvelles de l'école.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Media;