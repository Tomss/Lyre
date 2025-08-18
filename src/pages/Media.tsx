import React from 'react';
import { Image, Play, Camera, Music, FileText, File, Filter, Search, X } from 'lucide-react';
import MediaGallery from '../components/MediaGallery';
import MediaPreview from '../components/MediaPreview';

const Media = () => {
  const [mediaItems, setMediaItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState(['album', 'enregistrement', 'journal', 'lyrissimot']);
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
      case 'lyrissimot': return File;
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

  const toggleTypeFilter = (type) => {
    setTypeFilter(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Filtrer les médias
  const filteredMedia = mediaItems.filter(media => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      media.title.toLowerCase().includes(searchLower) ||
      (media.description && media.description.toLowerCase().includes(searchLower))
    );
    
    const matchesType = typeFilter.includes(media.media_type);
    
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
    <div className="font-inter pt-20">
      {/* Galerie modale */}
      {selectedMedia && (
        <MediaGallery
          media={selectedMedia}
          isOpen={isGalleryOpen}
          onClose={closeGallery}
        />
      )}

      {/* Header Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h1 className="font-poppins font-bold text-4xl md:text-5xl text-dark mb-6">
              Galerie de nos moments musicaux.
            </h1>
            {loading ? (
              <p className="font-inter text-lg text-gray-600 max-w-2xl mx-auto">
                Chargement de nos médias...
              </p>
            ) : mediaItems.length > 0 ? (
              <p className="font-inter text-lg text-gray-600 max-w-2xl mx-auto">
                Découvrez nos albums, enregistrements, articles de presse et actualités !
              </p>
            ) : (
              <p className="font-inter text-lg text-gray-600 max-w-2xl mx-auto">
                Nos médias seront bientôt disponibles. Revenez nous voir !
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Filtres et recherche */}
      {mediaItems.length > 0 && (
        <section className="py-8 bg-white border-b border-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Recherche */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher dans nos médias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-64"
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
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                {[
                  { key: 'album', label: 'Albums', icon: Camera, color: 'blue' },
                  { key: 'enregistrement', label: 'Enregistrements', icon: Music, color: 'green' },
                  { key: 'journal', label: 'Journaux', icon: FileText, color: 'yellow' },
                  { key: 'lyrissimot', label: 'Lyrissimots', icon: File, color: 'purple' }
                ].map(({ key, label, icon: Icon, color }) => (
                  <button
                    key={key}
                    onClick={() => toggleTypeFilter(key)}
                    className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      typeFilter.includes(key)
                        ? `bg-${color}-100 text-${color}-800 border border-${color}-200`
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Médias mis en avant */}
      {featuredMedia.length > 0 && (
        <section className="py-12 bg-gradient-to-r from-accent/5 to-primary/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="font-poppins font-bold text-2xl md:text-3xl text-dark mb-4">
                ⭐ Médias mis en avant
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredMedia.map((media) => {
                const TypeIcon = getTypeIcon(media.media_type);
                return (
                  <div key={media.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in group">
                    {/* Prévisualisation visuelle */}
                    <MediaPreview
                      files={media.media_files}
                      mediaType={media.media_type}
                      onClick={() => openGallery(media)}
                      className="cursor-pointer"
                    />
                    
                    <div className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <TypeIcon className="h-6 w-6 text-primary" />
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
                        <span>{new Date(media.created_at).toLocaleDateString('fr-FR')}</span>
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
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center animate-fade-in">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement de nos médias...</p>
            </div>
          ) : filteredMedia.length === 0 && searchTerm ? (
            <div className="text-center animate-fade-in">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Aucun média trouvé pour "{searchTerm}"</p>
              <button onClick={() => setSearchTerm('')} className="text-primary hover:text-primary/80">Effacer la recherche</button>
            </div>
          ) : regularMedia.length > 0 ? (
            <>
              {featuredMedia.length > 0 && (
                <div className="text-center mb-8">
                  <h2 className="font-poppins font-bold text-2xl md:text-3xl text-dark mb-4">
                    Tous nos médias
                  </h2>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularMedia.map((media) => {
                  const TypeIcon = getTypeIcon(media.media_type);
                  return (
                    <div key={media.id} className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in group">
                      {/* Prévisualisation visuelle */}
                      <MediaPreview
                        files={media.media_files}
                        mediaType={media.media_type}
                        onClick={() => openGallery(media)}
                        className="cursor-pointer"
                      />
                      
                      <div className="p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="bg-primary/10 p-1.5 rounded-lg">
                            <TypeIcon className="h-4 w-4 text-primary" />
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(media.media_type)}`}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {getTypeLabel(media.media_type)}
                          </span>
                        </div>
                        
                        <h3 className="font-poppins font-semibold text-lg text-dark mb-2">
                          {media.title}
                        </h3>
                        
                        {media.description && (
                          <p className="font-inter text-gray-600 mb-3 text-sm leading-relaxed line-clamp-2">
                            {media.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{media.media_files.length} fichier{media.media_files.length > 1 ? 's' : ''}</span>
                          <span>{new Date(media.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : mediaItems.length === 0 ? (
            <div className="text-center animate-fade-in">
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8">
                <Image className="h-16 w-16 text-primary" />
              </div>
              <h2 className="font-poppins font-semibold text-2xl text-dark mb-4">
                Nos médias arrivent bientôt !
              </h2>
              <p className="font-inter text-gray-600 max-w-md mx-auto">
                Notre équipe travaille actuellement sur la mise en ligne de nos albums, enregistrements et actualités. 
                Revenez bientôt pour les découvrir !
              </p>
            </div>
          ) : (
            <div className="text-center animate-fade-in">
              <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucun média ne correspond aux filtres sélectionnés</p>
            </div>
          )}
        </div>
      </section>

      {/* Media Categories */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-poppins font-bold text-2xl md:text-3xl text-dark mb-4">
              Nos différents types de médias
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-8 shadow-md text-center animate-fade-in">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-poppins font-semibold text-xl text-dark mb-4">
                Albums
              </h3>
              <p className="font-inter text-gray-600">
                Nos albums photos et vidéos des concerts, répétitions et événements de l'école.
              </p>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-md text-center animate-fade-in">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Music className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-poppins font-semibold text-xl text-dark mb-4">
                Enregistrements
              </h3>
              <p className="font-inter text-gray-600">
                Écoutez nos enregistrements audio de concerts et répétitions.
              </p>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-md text-center animate-fade-in">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="font-poppins font-semibold text-xl text-dark mb-4">
                Journaux
              </h3>
              <p className="font-inter text-gray-600">
                "On parle de nous" - Découvrez les articles de presse sur notre école.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mt-8 max-w-md mx-auto">
            <div className="bg-white rounded-lg p-8 shadow-md text-center animate-fade-in">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <File className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-poppins font-semibold text-xl text-dark mb-4">
                Lyrissimots
              </h3>
              <p className="font-inter text-gray-600">
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