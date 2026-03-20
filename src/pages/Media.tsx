import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../config';
import { Link } from 'react-router-dom';
import { Image, Camera, Music, FileText, Filter, Search, X, ChevronRight, Star, Calendar, Sparkles, Type } from 'lucide-react';
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
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | '6m' | '1y'>('all');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(20);
  }, [searchTerm, selectedType, selectedPeriod]);

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

  useEffect(() => {
    fetchMedia();
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'album': return 'bg-teal-50 text-teal-600 border-teal-100';
      case 'enregistrement': return 'bg-sky-50 text-sky-600 border-sky-100';
      case 'journal': return 'bg-slate-50 text-slate-600 border-slate-200';
      case 'lyrissimot': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'album': return Camera;
      case 'enregistrement': return Music;
      case 'journal': return FileText;
      case 'lyrissimot': return Type;
      default: return Image;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'album': return 'Albums';
      case 'enregistrement': return 'Audios';
      case 'journal': return 'Presse';
      case 'lyrissimot': return 'Lyrissimots';
      default: return type;
    }
  };

  const selectType = (type: string) => {
    setSelectedType(type);
  };

  // Logic pour filtrer par période
  const isWithinPeriod = (dateStr?: string, createdAt?: string) => {
    if (selectedPeriod === 'all') return true;
    
    const date = new Date(dateStr || createdAt || '');
    if (isNaN(date.getTime())) return true; // Si pas de date, on garde

    const now = new Date();
    const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());

    if (selectedPeriod === '6m') return diffMonths <= 6;
    if (selectedPeriod === '1y') return diffMonths <= 12;
    
    return true;
  };

  // Filtrer les médias
  const filteredMedia = mediaItems.filter(media => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      media.title.toLowerCase().includes(searchLower) ||
      (media.description && media.description.toLowerCase().includes(searchLower))
    );

    const matchesType = selectedType === 'all' || media.media_type === selectedType;
    const matchesPeriod = isWithinPeriod(media.media_date, media.created_at);

    return matchesSearch && matchesType && matchesPeriod;
  });

  // Séparer les médias mis en avant
  const featuredMedia = filteredMedia.filter(media => media.is_featured);
  const regularMedia = filteredMedia.filter(media => !media.is_featured);

  const openGallery = (media: MediaItem) => {
    if (media.media_files && media.media_files.length > 0) {
      setSelectedMedia(media);
      setIsGalleryOpen(true);
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
        <section id="featured" className="scroll-mt-20 py-20 bg-gradient-to-br from-slate-50 via-gray-50 to-teal-50 relative overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="font-poppins font-bold text-3xl md:text-5xl text-slate-900 mb-6 relative inline-block">
                Médias mis en avant
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-teal-500 rounded-full"></div>
              </h2>
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

      {/* Section Médiathèque */}
      <section id="library" className="scroll-mt-20 py-20 bg-white relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="font-poppins font-bold text-3xl md:text-5xl text-slate-900 mb-6 relative inline-block">
              Notre Médiathèque
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-teal-500 rounded-full"></div>
            </h2>
          </div>

          {/* Barre de filtres et recherche */}
          {mediaItems.length > 0 && (
            <div className="mb-16 relative z-10">
              <div className="w-full">
                <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-4 lg:p-6 shadow-2xl shadow-slate-200/50 border border-slate-100 space-y-6">
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
                    
                    {/* Filtres par Type */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 text-slate-400 mb-3 ml-2">
                        <Filter className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Type de média</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => selectType('all')}
                          className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-500 ${selectedType === 'all'
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105'
                            : 'bg-slate-50 text-slate-600 border border-slate-100 hover:border-teal-400 hover:bg-white'
                            }`}
                        >
                          <Sparkles className={`h-4 w-4 ${selectedType === 'all' ? 'text-white' : 'text-teal-500'}`} />
                          <span>Tout</span>
                        </button>
                        {[
                          { key: 'album', label: 'Albums', icon: Camera, color: 'teal' },
                          { key: 'enregistrement', label: 'Audios', icon: Music, color: 'sky' },
                          { key: 'journal', label: 'Presse', icon: FileText, color: 'slate' },
                          { key: 'lyrissimot', label: 'Lyrissimots', icon: Type, color: 'indigo' }
                        ].map(({ key, label, icon: Icon, color }) => (
                          <button
                            key={key}
                            onClick={() => selectType(key)}
                            className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-500 group ${selectedType === key
                              ? key === 'album' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20 scale-105' :
                                key === 'enregistrement' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20 scale-105' :
                                key === 'journal' ? 'bg-slate-500 text-white shadow-lg shadow-slate-500/20 scale-105' :
                                'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-105'
                              : 'bg-slate-50 text-slate-600 border border-slate-100 hover:border-teal-400 hover:bg-white'
                              }`}
                          >
                            <Icon className={`h-4 w-4 ${selectedType === key ? 'text-white' : `text-${color}-500 group-hover:scale-110 transition-transform`}`} />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filtres par Période */}
                    <div className="lg:w-auto">
                      <div className="flex items-center space-x-2 text-slate-400 mb-3 ml-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Période</span>
                      </div>
                      <div className="inline-flex p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                        {[
                          { key: 'all', label: 'Tout' },
                          { key: '6m', label: '6 mois' },
                          { key: '1y', label: '1 an' }
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => setSelectedPeriod(key as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${selectedPeriod === key
                              ? 'bg-white text-teal-600 shadow-sm'
                              : 'text-slate-400 hover:text-slate-600'
                              }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Recherche */}
                    <div className="lg:w-72">
                      <div className="flex items-center space-x-2 text-slate-400 mb-3 ml-2">
                        <Search className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Recherche</span>
                      </div>
                      <div className="relative group">
                        <input
                          type="text"
                          placeholder="Un titre, un souvenir..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-5 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all duration-500 placeholder-slate-400 text-slate-800 text-sm"
                        />
                        {searchTerm ? (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : (
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 group-focus-within:scale-110 transition-transform">
                            <Search className="h-4 w-4 text-slate-300" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Résumé des filtres actifs */}
                  {(selectedType !== 'all' || searchTerm || selectedPeriod !== 'all') && (
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Filtres actifs :</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedType !== 'all' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-teal-50 text-teal-600 text-[10px] font-bold border border-teal-100">
                              {getTypeLabel(selectedType)}
                            </span>
                          )}
                          {selectedPeriod !== 'all' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-100">
                              {selectedPeriod === '6m' ? '6 derniers mois' : 'Dernière année'}
                            </span>
                          )}
                          {searchTerm && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-[10px] font-bold italic border border-slate-100">
                              "{searchTerm}"
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedType('all');
                          setSearchTerm('');
                          setSelectedPeriod('all');
                        }}
                        className="text-[10px] font-black uppercase text-rose-400 hover:text-rose-500 transition-colors tracking-[0.2em] flex items-center space-x-1"
                      >
                        <X className="h-3 w-3" />
                        <span>Réinitialiser tout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="w-full relative z-10">
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-200 border-t-teal-500 mx-auto mb-4"></div>
                <p className="text-slate-500">Chargement de nos médias...</p>
              </div>
            ) : filteredMedia.length === 0 && searchTerm ? (
              <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-slate-100">
                <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Search className="h-12 w-12 text-slate-300" />
                </div>
                <p className="text-slate-600 mb-4 text-lg">Aucun média trouvé pour "{searchTerm}"</p>
                <button onClick={() => setSearchTerm('')} className="text-teal-600 hover:text-teal-700 font-bold bg-teal-50 px-8 py-4 rounded-2xl border border-teal-100 hover:bg-teal-100 transition-all duration-300">Effacer la recherche</button>
              </div>
            ) : regularMedia.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  {regularMedia.slice(0, visibleCount).map((media) => {
                    const TypeIcon = getTypeIcon(media.media_type);
                    return (
                      <div key={media.id} className="group relative bg-white rounded-[2rem] border border-slate-200 overflow-hidden hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl shadow-lg animate-fade-in group">
                        {/* Barre d'accentuation haute */}
                        <div className={`h-1.5 w-full transition-all duration-500 group-hover:h-3 ${media.media_type === 'album' ? 'bg-teal-500' : media.media_type === 'enregistrement' ? 'bg-sky-500' : media.media_type === 'journal' ? 'bg-slate-500' : media.media_type === 'lyrissimot' ? 'bg-indigo-500' : 'bg-gray-500'}`}></div>
                        
                        {/* Section Image / Preview */}
                        <div className="relative aspect-square overflow-hidden bg-slate-50">
                          <MediaPreview
                            files={media.media_files}
                            mediaType={media.media_type}
                            onClick={() => openGallery(media)}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          
                          {/* Badge de Type */}
                          <div className="absolute top-3 left-3 z-20">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] ${media.media_type === 'album' ? 'bg-teal-500 text-white' : media.media_type === 'enregistrement' ? 'bg-sky-500 text-white' : media.media_type === 'journal' ? 'bg-slate-500 text-white' : 'bg-indigo-500 text-white'} shadow-lg backdrop-blur-xl`}>
                              <TypeIcon className="h-3.5 w-3.5 mr-1.5" />
                              {getTypeLabel(media.media_type)}
                            </span>
                          </div>

                          {!!media.is_featured && (
                            <div className="absolute top-3 right-3 bg-amber-400 text-white p-2 rounded-full shadow-lg z-20 animate-pulse border-2 border-white">
                              <Star className="h-3 w-3 fill-current" />
                            </div>
                          )}
                        </div>

                        <div className="p-4 flex flex-col items-center text-center relative bg-white">
                          <h3 className="font-poppins font-bold text-base text-slate-800 line-clamp-1 mb-2 group-hover:text-teal-600 transition-colors relative z-10">
                            {media.title}
                          </h3>

                          <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-400 relative z-10">
                            <div className={`w-1.5 h-1.5 rounded-full ${media.media_type === 'album' ? 'bg-teal-400' : media.media_type === 'enregistrement' ? 'bg-sky-400' : media.media_type === 'journal' ? 'bg-slate-400' : media.media_type === 'lyrissimot' ? 'bg-indigo-400' : 'bg-gray-400'}`}></div>
                            <span>{media.media_files.length} {media.media_files.length > 1 ? 'FICHIERS' : 'FICHIER'}</span>
                            <span>•</span>
                            <span>
                              {media.media_date
                                ? new Date(media.media_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
                                : new Date(media.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bouton Voir Plus */}
                {visibleCount < regularMedia.length && (
                  <div className="mt-16 text-center">
                    <button
                      onClick={() => setVisibleCount((prev: number) => prev + 20)}
                      className="group relative inline-flex items-center space-x-3 bg-white border-2 border-slate-200 text-slate-700 font-bold px-10 py-4 rounded-2xl transition-all duration-500 hover:border-teal-400 hover:text-teal-600 hover:shadow-xl hover:shadow-teal-900/5 overflow-hidden"
                    >
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-teal-500 to-sky-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                      <span className="text-lg">Voir plus de médias</span>
                      <div className="bg-slate-100 p-1.5 rounded-full group-hover:bg-teal-50 transition-colors duration-500">
                        <ChevronRight className="h-5 w-5 transform group-hover:rotate-90 transition-transform duration-500" />
                      </div>
                    </button>
                    <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Affichage de {Math.min(visibleCount, regularMedia.length)} sur {regularMedia.length} médias
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <div className="bg-slate-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <Filter className="h-12 w-12 text-slate-400" />
                </div>
                <p className="text-slate-500 text-lg font-medium">Aucun média ne correspond aux filtres sélectionnés</p>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* Séparation visuelle */}
      <div className="bg-white relative py-4">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-50"></div>
      </div>

      {/* Section d'appel à contribution - Carte Dark sur fond blanc */}
      <section id="contribute" className="scroll-mt-20 py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Titre Standard (Style Thème) */}
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="font-poppins font-bold text-3xl md:text-5xl text-slate-900 mb-6 relative inline-block">
                Partagez vos souvenirs !
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-teal-500 rounded-full"></div>
              </h2>
            </div>

            <div className="relative group">
              {/* Card glowing border effect (subtil) */}
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/30 to-indigo-500/30 rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              
              <div className="relative bg-slate-900 rounded-[3rem] p-10 md:p-16 border border-slate-800 shadow-2xl overflow-hidden">
                {/* Background Decor (discret) */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 relative z-10">
                  <div className="text-center group/item hover:scale-105 transition-transform duration-300">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-teal-400 blur-2xl opacity-0 group-hover/item:opacity-20 transition-opacity"></div>
                      <div className="bg-slate-800/80 w-24 h-24 rounded-3xl flex items-center justify-center border border-white/10 shadow-inner">
                        <Camera className="h-12 w-12 text-teal-400" />
                      </div>
                    </div>
                    <h3 className="font-poppins font-bold text-xl text-white mb-3">Photos & Vidéos</h3>
                    <p className="text-sm text-slate-400 font-medium italic">Concerts, répétitions, moments de convivialité capturés.</p>
                  </div>

                  <div className="text-center group/item hover:scale-105 transition-transform duration-300">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-indigo-400 blur-2xl opacity-0 group-hover/item:opacity-20 transition-opacity"></div>
                      <div className="bg-slate-800/80 w-24 h-24 rounded-3xl flex items-center justify-center border border-white/10 shadow-inner">
                        <Music className="h-12 w-12 text-indigo-400" />
                      </div>
                    </div>
                    <h3 className="font-poppins font-bold text-xl text-white mb-3">Enregistrements</h3>
                    <p className="text-sm text-slate-400 font-medium italic">Captations audio de vos performances sur scène.</p>
                  </div>

                  <div className="text-center group/item hover:scale-105 transition-transform duration-300">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-sky-400 blur-2xl opacity-0 group-hover/item:opacity-20 transition-opacity"></div>
                      <div className="bg-slate-800/80 w-24 h-24 rounded-3xl flex items-center justify-center border border-white/10 shadow-inner">
                        <FileText className="h-12 w-12 text-sky-400" />
                      </div>
                    </div>
                    <h3 className="font-poppins font-bold text-xl text-white mb-3">Articles de Presse</h3>
                    <p className="text-sm text-slate-400 font-medium italic">Coupures de journaux et interviews mémorables.</p>
                  </div>
                </div>

                <div className="max-w-2xl mx-auto text-center relative z-10 border-t border-white/10 pt-12">
                  <p className="font-medium text-lg md:text-xl text-slate-200 leading-relaxed mb-10 italic">
                    Chaque souvenir compte ! Vos contributions nous aident à préserver et partager l'histoire musicale de notre école.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Link
                      to="/contact"
                      className="group relative inline-flex items-center space-x-3 bg-teal-600 text-white font-black px-12 py-5 rounded-2xl transition-all duration-300 hover:scale-105 hover:bg-teal-500"
                    >
                      <span className="text-lg uppercase tracking-wider">Nous contacter</span>
                      <ChevronRight className="h-6 w-6 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                  
                  <div className="mt-8 text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center justify-center space-x-2">
                    <span className="w-8 h-px bg-white/10"></span>
                    <span>Envoyez-nous vos fichiers par email ou via ce formulaire</span>
                    <span className="w-8 h-px bg-white/10"></span>
                  </div>
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
