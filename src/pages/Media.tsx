import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../config';
import { Link } from 'react-router-dom';
import { Image, Camera, Music, FileText, File, Filter, Search, X, ChevronRight, Star, Calendar, Sparkles, Type } from 'lucide-react';
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
  const [selectedType, setSelectedType] = React.useState('all');
  const [selectedPeriod, setSelectedPeriod] = React.useState<'all' | '6m' | '1y'>('all'); // Nouveau filtre temporel
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
      case 'lyrissimot': return FileText;
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
      const audioUrl = audioFile.file_path;
      const audio = new Audio(audioUrl);
      audio.play().catch(err => {
        console.error('Erreur lecture audio:', err);
        // Fallback : ouvrir dans un nouvel onglet
        window.open(audioUrl, '_blank');
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

      {/* Tous les médias */}
      <section id="library" className="scroll-mt-20 py-24 bg-slate-900 relative overflow-hidden">
        {/* Motif Cubes Discret comme dans School.tsx */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        {/* Ligne de séparation dégradée teal en haut */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Filtres et recherche intégrés */}
          {mediaItems.length > 0 && (
            <div className="mb-16 relative z-10">
              <div className="w-full">
                {/* Header avec titre et filtres/recherche */}
                <div className="max-w-4xl mx-auto text-center mb-16">
                  <h2 className="font-poppins font-bold text-3xl md:text-5xl text-white mb-6 relative inline-block">
                    Notre Médiathèque
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-teal-500 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.5)]"></div>
                  </h2>
                </div>

                {/* Barre de filtres et recherche modernisée - Style Glassmorphism Dark */}
                <div className="bg-white/10 backdrop-blur-2xl rounded-[2.5rem] p-4 lg:p-6 shadow-2xl border border-white/10 space-y-6">
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
                    
                    {/* Filtres par Type */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 text-slate-300 mb-3 ml-2">
                        <Filter className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Type de média</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => selectType('all')}
                          className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-500 ${selectedType === 'all'
                            ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-105'
                            : 'bg-white/5 text-slate-300 border border-white/10 hover:border-teal-400 hover:bg-white/10'
                            }`}
                        >
                          <Sparkles className={`h-4 w-4 ${selectedType === 'all' ? 'text-white' : 'text-teal-400'}`} />
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
                              ? `bg-${color}-500 text-white shadow-lg shadow-${color}-500/20 scale-105`
                              : `bg-white/5 text-slate-300 border border-white/10 hover:border-${color}-400 hover:bg-white/10`
                              }`}
                          >
                            <Icon className={`h-4 w-4 ${selectedType === key ? 'text-white' : `text-${color}-400 group-hover:scale-110 transition-transform`}`} />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filtres par Période */}
                    <div className="lg:w-auto">
                      <div className="flex items-center space-x-2 text-slate-300 mb-3 ml-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Période</span>
                      </div>
                      <div className="inline-flex p-1.5 bg-slate-950/50 rounded-2xl border border-white/5">
                        {[
                          { key: 'all', label: 'Tout' },
                          { key: '6m', label: '6 mois' },
                          { key: '1y', label: '1 an' }
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => setSelectedPeriod(key as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${selectedPeriod === key
                              ? 'bg-gradient-to-r from-teal-500 to-sky-500 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                              }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Recherche */}
                    <div className="lg:w-72">
                      <div className="flex items-center space-x-2 text-slate-300 mb-3 ml-2">
                        <Search className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Recherche</span>
                      </div>
                      <div className="relative group">
                        <input
                          type="text"
                          placeholder="Un titre, un souvenir..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-5 pr-12 py-3 bg-slate-950/50 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-slate-950 transition-all duration-500 placeholder-slate-500 text-white text-sm"
                        />
                        {searchTerm ? (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-rose-500 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : (
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 group-focus-within:scale-110 transition-transform">
                            <Search className="h-4 w-4 text-slate-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Résumé des filtres actifs */}
                  {(selectedType !== 'all' || searchTerm || selectedPeriod !== 'all') && (
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Filtres actifs :</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedType !== 'all' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-[10px] font-bold border border-teal-500/20">
                              {getTypeLabel(selectedType)}
                            </span>
                          )}
                          {selectedPeriod !== 'all' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                              {selectedPeriod === '6m' ? '6 derniers mois' : 'Dernière année'}
                            </span>
                          )}
                          {searchTerm && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 text-slate-300 text-[10px] font-bold italic border border-white/10">
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
                <div className="max-w-4xl mx-auto text-center mb-16 relative z-10">
                  <h2 className="font-poppins font-bold text-3xl md:text-5xl text-white mb-6 relative inline-block">
                    Tous nos médias
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-teal-500 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.5)]"></div>
                  </h2>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 relative z-10">
                {regularMedia.map((media) => {
                  const TypeIcon = getTypeIcon(media.media_type);
                  return (
                    <div key={media.id} className="group relative bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 overflow-hidden hover:-translate-y-2 transition-all duration-500 hover:bg-white/10 hover:border-white/20 shadow-2xl animate-fade-in">
                      {/* Barre d'accentuation haute */}
                      <div className={`h-1.5 w-full transition-all duration-500 group-hover:h-3 ${media.media_type === 'album' ? 'bg-teal-500' : media.media_type === 'enregistrement' ? 'bg-sky-500' : media.media_type === 'journal' ? 'bg-slate-500' : media.media_type === 'lyrissimot' ? 'bg-indigo-500' : 'bg-gray-500'}`}></div>
                      
                      {/* Section Image / Preview avec Badge Overlay */}
                      <div className="relative aspect-square overflow-hidden bg-slate-950">
                        <MediaPreview
                          files={media.media_files}
                          mediaType={media.media_type}
                          onClick={() => openGallery(media)}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        
                        {/* Badge de Type en Overlay */}
                        <div className="absolute top-3 left-3 z-20">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] ${media.media_type === 'album' ? 'bg-teal-500/20 text-teal-400 border-teal-500/30' : media.media_type === 'enregistrement' ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' : media.media_type === 'journal' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'} border shadow-lg backdrop-blur-xl bg-slate-900/60`}>
                            <TypeIcon className="h-3.5 w-3.5 mr-1.5" />
                            {getTypeLabel(media.media_type)}
                          </span>
                        </div>

                        {!!media.is_featured && (
                          <div className="absolute top-3 right-3 bg-amber-400 text-white p-2 rounded-full shadow-lg z-20 animate-pulse border-2 border-white">
                            <Star className="h-3 w-3 fill-current" />
                          </div>
                        )}
                        
                        {/* Overlay au survol */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 pointer-events-none"></div>
                      </div>

                      <div className="p-4 flex flex-col items-center text-center relative">
                        {/* Filigrane discret pour le fond */}
                        <div className="absolute -right-2 -bottom-2 opacity-[0.03] rotate-[15deg] pointer-events-none text-white">
                          <TypeIcon className="h-20 w-20" />
                        </div>

                        <h3 className="font-poppins font-bold text-base text-white line-clamp-1 mb-2 group-hover:text-teal-400 transition-colors relative z-10">
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
            </>
          ) : mediaItems.length === 0 ? (
            <div className="text-center animate-fade-in relative z-10">
              <div className="bg-slate-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Image className="h-12 w-12 text-slate-400" />
              </div>
              <h2 className="font-poppins font-semibold text-2xl text-slate-700 mb-4">
                Nos médias arrivent bientôt !
              </h2>
              <p className="font-inter text-slate-500 max-md mx-auto">
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
      <section id="contribute" className="scroll-mt-20 py-20 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="max-w-4xl mx-auto text-center mb-16 animate-fade-in text-center">
              <h2 className="font-poppins font-bold text-3xl md:text-5xl text-slate-900 mb-6 relative inline-block">
                Partagez vos souvenirs !
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-teal-500 rounded-full"></div>
              </h2>
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
