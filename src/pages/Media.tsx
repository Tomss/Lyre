import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../config';
import { Link } from 'react-router-dom';
import { Image, Camera, Music, FileText, File, Filter, Search, X, ChevronRight, Star } from 'lucide-react';
import MediaGallery from '../components/MediaGallery';
import MediaPreview from '../components/MediaPreview';
import PageHero from '../components/PageHero';

interface MediaFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: 'image' | 'audio' | 'pdf' | 'video';
  alt_text: string | null;
  sort_order: number;
}

interface MediaItem {
  id: string;
  title: string;
  description: string | null;
  media_type: 'album' | 'enregistrement' | 'journal' | 'lyrissimot';
  media_date?: string;
  created_at: string;
  is_featured: boolean;
  published: boolean;
  media_files: MediaFile[];
}

const Media = () => {
  const { pageHeaders } = useTheme();
  const [mediaItems, setMediaItems] = React.useState<MediaItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedType, setSelectedType] = React.useState('album'); // Présélectionner Albums par défaut
  const [selectedMedia, setSelectedMedia] = React.useState<MediaItem | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = React.useState(false);

  // Récupérer tous les médias publiés
  const fetchMedia = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/public-media`, {
        method: 'GET',
        headers: {
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'album': return 'bg-teal-100 text-teal-800';
      case 'enregistrement': return 'bg-sky-100 text-sky-800';
      case 'journal': return 'bg-slate-100 text-slate-800';
      case 'lyrissimot': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'album': return Camera;
      case 'enregistrement': return Music;
      case 'journal': return FileText;
      case 'lyrissimot': return Music;
      default: return Image;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'album': return 'Album';
      case 'enregistrement': return 'Enregistrement';
      case 'journal': return 'Journal';
      case 'lyrissimot': return 'Lyrissimot';
      default: return type;
    }
  };

  const selectType = (type: string) => {
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

  const openGallery = (media: MediaItem) => {
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

  const openAudioPlayer = (media: MediaItem) => {
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

  const openPdfViewer = (pdfFile: MediaFile) => {
    // Ouvrir le PDF dans un nouvel onglet
    window.open(pdfFile.file_path, '_blank');
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
      <PageHero
        title={<span>Galerie <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-500">Multimédia</span></span>}
        subtitle="Revivez les moments forts de La Lyre : albums, enregistrements et souvenirs."
        backgroundImage={pageHeaders['media'] || "https://images.pexels.com/photos/164743/pexels-photo-164743.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"}
        anchors={[
          { label: "À la Une", targetId: "featured", icon: Star, color: "amber" },
          { label: "Médiathèque", targetId: "library", icon: Image, color: "teal" },
          { label: "Contribuer", targetId: "contribute", icon: Camera, color: "rose" }
        ]}
      />

      {/* Médias mis en avant */}
      {featuredMedia.length > 0 && (
        <section id="featured" className="scroll-mt-32 py-20 bg-gradient-to-br from-slate-50 via-gray-50 to-teal-50 relative overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 relative z-10">
              <div className="inline-block mb-6">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-teal-400"></div>
                  <div className="bg-gradient-to-br from-teal-400 to-cyan-500 p-2 rounded-full shadow-lg">
                    <Star className="h-6 w-6 text-white animate-pulse" />
                  </div>
                  <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-teal-400"></div>
                </div>
              </div>
              <h2 className="font-poppins font-bold text-4xl md:text-5xl text-slate-800 mb-6">
                Médias mis en avant
              </h2>
              <p className="font-inter text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
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
                        <div className="bg-gradient-to-br from-teal-400 to-cyan-500 p-2 rounded-lg shadow-md">
                          <TypeIcon className="h-6 w-6 text-white" />
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(media.media_type)}`}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {getTypeLabel(media.media_type)}
                        </span>
                      </div>

                      <h3 className="font-poppins font-semibold text-xl text-slate-800 mb-3">
                        {media.title}
                      </h3>

                      {media.description && (
                        <p className="font-inter text-slate-600 mb-4 text-sm leading-relaxed">
                          {media.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-sm text-slate-500">
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
      <section id="library" className="scroll-mt-32 py-20 bg-slate-50 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filtres et recherche intégrés */}
          {mediaItems.length > 0 && (
            <div className="mb-16 relative z-10">
              <div className="max-w-6xl mx-auto">
                {/* Header avec titre et filtres/recherche */}
                <div className="text-center mb-12">
                  <div className="inline-block mb-8">
                    <div className="flex items-center justify-center space-x-4 mb-6">
                      <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-teal-400"></div>
                      <Image className="h-8 w-8 text-teal-400 animate-pulse" />
                      <div className="w-16 h-0.5 bg-gradient-to-l from-transparent via-teal-400 to-teal-400"></div>
                    </div>
                  </div>
                  <h2 className="font-poppins font-bold text-5xl md:text-6xl text-slate-800 mb-6">
                    Notre Médiathèque
                  </h2>
                  <p className="text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed mb-12">
                    Explorez notre collection de souvenirs musicaux et découvertes artistiques
                  </p>
                </div>

                {/* Barre de filtres et recherche */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                  <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0 lg:space-x-8">
                    {/* Filtres à gauche */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2 text-slate-600 mr-4">
                        <Filter className="h-5 w-5" />
                        <span className="font-medium text-sm">Filtrer :</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => selectType('all')}
                          className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border ${selectedType === 'all'
                            ? 'bg-teal-600 text-white border-teal-500 shadow-lg shadow-teal-500/25'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                          <span>Tout</span>
                        </button>
                        {[{ key: 'album', label: 'Albums', icon: Camera },
                        { key: 'enregistrement', label: 'Audio', icon: Music },
                        { key: 'journal', label: 'Presse', icon: FileText },
                        { key: 'lyrissimot', label: 'Lyrissimots', icon: File }].map(({ key, label, icon: Icon }) => (
                          <button
                            key={key}
                            onClick={() => selectType(key)}
                            className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border ${selectedType === key
                              ? 'bg-teal-600 text-white border-teal-500 shadow-lg shadow-teal-500/25'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Recherche à droite */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 w-64 text-slate-800 placeholder-slate-400 transition-all duration-300"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Informations et actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-6 border-t border-slate-100">
                    <div className="flex items-center space-x-4 text-sm text-slate-500 mb-4 sm:mb-0">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                        <span>{filteredMedia.length} résultat{filteredMedia.length > 1 ? 's' : ''}</span>
                      </div>
                      {(selectedType !== 'all' || searchTerm) && (
                        <div className="flex items-center space-x-2">
                          <div className="w-1 h-4 bg-slate-300 rounded-full"></div>
                          <span className="text-teal-600">
                            {selectedType !== 'all' && `Filtré par ${selectedType === 'album' ? 'Albums' : selectedType === 'enregistrement' ? 'Audio' : selectedType === 'journal' ? 'Presse' : selectedType === 'lyrissimot' ? 'Lyrissimots' : ''}`}
                            {selectedType !== 'all' && searchTerm && ' • '}
                            {searchTerm && `"${searchTerm}"`}
                          </span>
                        </div>
                      )}
                    </div>

                    {(selectedType !== 'all' || searchTerm) && (
                      <button
                        onClick={() => {
                          setSelectedType('all');
                          setSearchTerm('');
                        }}
                        className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-200"
                      >
                        <X className="h-3 w-3" />
                        <span>Réinitialiser</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center animate-fade-in relative z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-200 border-t-teal-500 mx-auto mb-4"></div>
              <p className="text-slate-500">Chargement de nos médias...</p>
            </div>
          ) : filteredMedia.length === 0 && searchTerm ? (
            <div className="text-center animate-fade-in relative z-10">
              <div className="bg-slate-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Search className="h-12 w-12 text-slate-300" />
              </div>
              <p className="text-slate-600 mb-4 text-lg">Aucun média trouvé pour "{searchTerm}"</p>
              <button onClick={() => setSearchTerm('')} className="text-teal-600 hover:text-teal-700 font-medium bg-teal-50 px-6 py-3 rounded-2xl border border-teal-100 hover:bg-teal-100 transition-all duration-300">Effacer la recherche</button>
            </div>
          ) : regularMedia.length > 0 ? (
            <>
              {featuredMedia.length > 0 && (
                <div className="text-center mb-16 relative z-10">
                  <h2 className="font-poppins font-bold text-4xl md:text-5xl text-slate-800 mb-6">
                    Tous nos médias
                  </h2>
                  <p className="text-slate-500 text-xl">
                    Découvrez l'ensemble de notre collection
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 relative z-10">
                {regularMedia.map((media) => {
                  const TypeIcon = getTypeIcon(media.media_type);
                  return (
                    <div key={media.id} className={`rounded-2xl shadow-sm border overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-500 animate-fade-in group relative ${media.media_type === 'album' ? 'bg-white border-teal-100' : media.media_type === 'enregistrement' ? 'bg-white border-sky-100' : media.media_type === 'journal' ? 'bg-white border-slate-200' : media.media_type === 'lyrissimot' ? 'bg-white border-indigo-100' : 'bg-white border-gray-200'}`}>
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
                          <div className="bg-slate-50 p-1.5 rounded-lg">
                            <TypeIcon className="h-4 w-4 text-slate-600" />
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(media.media_type)}`}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {getTypeLabel(media.media_type)}
                          </span>
                          {media.is_featured && (
                            <span className="text-amber-400">⭐</span>
                          )}
                        </div>

                        <h3 className="font-poppins font-semibold text-lg text-slate-800 mb-2">
                          {media.title}
                        </h3>

                        {media.description && (
                          <p className="font-inter text-slate-500 mb-3 text-sm leading-relaxed line-clamp-3">
                            {media.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-sm text-slate-400">
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
              <div className="bg-slate-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Image className="h-12 w-12 text-slate-400" />
              </div>
              <h2 className="font-poppins font-semibold text-2xl text-slate-700 mb-4">
                Nos médias arrivent bientôt !
              </h2>
              <p className="font-inter text-slate-500 max-w-md mx-auto">
                Notre équipe travaille actuellement sur la mise en ligne de nos albums, enregistrements et actualités.
                Revenez bientôt pour les découvrir !
              </p>
            </div>
          ) : (
            <div className="text-center animate-fade-in relative z-10">
              <div className="bg-slate-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Filter className="h-12 w-12 text-slate-400" />
              </div>
              <p className="text-slate-500 text-lg">Aucun média ne correspond aux filtres sélectionnés</p>
            </div>
          )}
        </div>
      </section>

      {/* Section d'appel à contribution */}
      {/* Section d'appel à contribution */}
      <section id="contribute" className="scroll-mt-32 py-20 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 animate-fade-in">
              <div className="inline-block mb-8">
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-teal-500 to-teal-500"></div>
                  <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-3 rounded-full shadow-lg">
                    <Camera className="h-8 w-8 text-white animate-pulse" />
                  </div>
                  <div className="w-16 h-0.5 bg-gradient-to-l from-transparent via-teal-500 to-teal-500"></div>
                </div>
              </div>
              <h2 className="font-poppins font-bold text-3xl md:text-4xl text-slate-800 mb-6">
                Partagez vos souvenirs !
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8">
                Vous avez des photos, vidéos ou enregistrements de nos concerts et événements ?
                Aidez-nous à enrichir notre médiathèque en partageant vos précieux souvenirs !
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100 animate-fade-in group hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
              <div className="relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                  <div className="text-center group/item">
                    <div className="bg-teal-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover/item:scale-110 transition-transform duration-300">
                      <Camera className="h-10 w-10 text-teal-600" />
                    </div>
                    <h3 className="font-poppins font-semibold text-lg text-slate-800 mb-2">Photos & Vidéos</h3>
                    <p className="text-sm text-slate-500">Concerts, répétitions, moments de convivialité</p>
                  </div>

                  <div className="text-center group/item">
                    <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover/item:scale-110 transition-transform duration-300">
                      <Music className="h-10 w-10 text-indigo-600" />
                    </div>
                    <h3 className="font-poppins font-semibold text-lg text-slate-800 mb-2">Enregistrements</h3>
                    <p className="text-sm text-slate-500">Captations audio de nos performances</p>
                  </div>

                  <div className="text-center group/item">
                    <div className="bg-slate-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover/item:scale-110 transition-transform duration-300">
                      <FileText className="h-10 w-10 text-slate-600" />
                    </div>
                    <h3 className="font-poppins font-semibold text-lg text-slate-800 mb-2">Articles de Presse</h3>
                    <p className="text-sm text-slate-500">Coupures de journaux, interviews</p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-slate-600 mb-8 text-xl leading-relaxed">
                    Chaque souvenir compte ! Vos contributions nous aident à préserver et partager
                    l'histoire musicale de notre école.
                  </p>

                  <Link
                    to="/contact"
                    className="inline-flex items-center space-x-3 bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg shadow-md group/btn"
                  >
                    <span className="text-xl">Nous contacter</span>
                    <div className="bg-white/20 p-2 rounded-full group-hover/btn:bg-white/30 transition-colors duration-300">
                      <ChevronRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </div>
                  </Link>

                  <p className="text-sm text-slate-400 mt-4">
                    💌 Envoyez-nous vos médias par email ou contactez-nous pour plus d'informations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Media;
