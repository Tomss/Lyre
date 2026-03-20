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
  const [selectedPeriod, setSelectedPeriod] = React.useState<'all' | '6m' | '1y'>('all');
  const [selectedMedia, setSelectedMedia] = React.useState<MediaItem | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = React.useState(false);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/public-media`);
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
      case 'album': return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      case 'enregistrement': return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'journal': return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      case 'lyrissimot': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
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
      case 'lyrissimot': return 'Mots';
      default: return type;
    }
  };

  const isWithinPeriod = (dateStr: string | undefined, createdAt: string) => {
    if (selectedPeriod === 'all') return true;
    const date = new Date(dateStr || createdAt);
    const now = new Date();
    const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    if (selectedPeriod === '6m') return diffMonths <= 6;
    if (selectedPeriod === '1y') return diffMonths <= 12;
    return true;
  };

  const filteredMedia = mediaItems.filter(media => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = media.title.toLowerCase().includes(searchLower) || (media.description && media.description.toLowerCase().includes(searchLower));
    const matchesType = selectedType === 'all' || media.media_type === selectedType;
    const matchesPeriod = isWithinPeriod(media.media_date, media.created_at);
    return matchesSearch && matchesType && matchesPeriod;
  });

  const featuredMedia = filteredMedia.filter(media => media.is_featured);
  const regularMedia = filteredMedia.filter(media => !media.is_featured);

  const openGallery = (media: MediaItem) => {
    if (media.media_files && media.media_files.length > 0) {
      if (media.media_type === 'album' || (media.media_type === 'journal' && media.media_files.some(f => f.file_type === 'image'))) {
        setSelectedMedia(media);
        setIsGalleryOpen(true);
      } else if (media.media_type === 'enregistrement') {
        const audioFile = media.media_files.find(f => f.file_type === 'audio');
        if (audioFile) window.open(audioFile.file_path, '_blank');
      } else {
        const pdfFile = media.media_files.find(f => f.file_type === 'pdf');
        if (pdfFile) window.open(pdfFile.file_path, '_blank');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden font-inter text-slate-100">
      {/* Background Blobs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
      <div className="absolute top-1/2 -right-20 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[150px] animate-float pointer-events-none"></div>
      
      {selectedMedia && (
        <MediaGallery media={selectedMedia} isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} />
      )}

      <PageHero
        title={<span>Notre <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-sky-400 to-indigo-500">Médiathèque</span></span>}
        subtitle="Explorez l'histoire et les moments forts de La Lyre à travers nos archives."
        backgroundImage={pageHeaders['media'] || "https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"}
      />

      <section className="py-12 md:py-20 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header & Filter Bar */}
          <div className="max-w-6xl mx-auto mb-16 space-y-12">
            <div className="text-center">
              <div className="inline-flex items-center space-x-3 mb-6 bg-slate-900/50 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
                <Sparkles className="h-5 w-5 text-teal-400 animate-pulse" />
                <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-300">Collection Officielle</span>
              </div>
              <h2 className="font-poppins font-bold text-4xl md:text-6xl text-white mb-6 tracking-tight">
                Explorez nos <span className="text-teal-400">Archives</span>
              </h2>
              <p className="text-slate-400 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
                Plongez dans l'univers musical de La Lyre à travers nos albums photos, enregistrements audios et coupures de presse.
              </p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-4 md:p-6 shadow-2xl relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-12 xl:col-span-5 relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-400 transition-colors" />
                  <input
                    type="text"
                    placeholder="Chercher un titre, une date..."
                    className="w-full bg-slate-950/50 border border-white/10 text-white placeholder-slate-500 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all duration-300 backdrop-blur-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="lg:col-span-6 xl:col-span-4 flex items-center bg-slate-950/30 p-1.5 rounded-2xl border border-white/5">
                  {(['all', '6m', '1y'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedPeriod(p)}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-500 ${
                        selectedPeriod === p ? 'bg-gradient-to-r from-teal-500 to-sky-500 text-white shadow-lg shadow-teal-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {p === 'all' ? 'Toujours' : p === '6m' ? '6 mois' : '1 an'}
                    </button>
                  ))}
                </div>

                <div className="lg:col-span-6 xl:col-span-3 flex justify-around items-center">
                  {[
                    { id: 'all', icon: Sparkles, color: 'teal' },
                    { id: 'album', icon: Image, color: 'teal' },
                    { id: 'enregistrement', icon: Music, color: 'sky' },
                    { id: 'journal', icon: FileText, color: 'slate' },
                    { id: 'lyrissimot', icon: Type, color: 'indigo' }
                  ].map((t) => {
                    const Icon = t.icon;
                    const isActive = selectedType === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedType(t.id)}
                        className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
                          isActive ? `bg-${t.color}-500 text-white shadow-lg shadow-${t.color}-500/30` : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {isActive && <span className="absolute -bottom-1.5 w-1.5 h-1.5 bg-white rounded-full"></span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent shadow-lg shadow-teal-500/20"></div>
                <p className="text-slate-400 animate-pulse font-medium">Harmonisation de la collection...</p>
             </div>
          ) : filteredMedia.length === 0 ? (
            <div className="text-center py-20 animate-fade-in group">
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-[3rem] p-12 border border-white/10 max-w-lg mx-auto overflow-hidden relative">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-500/5 rounded-full blur-3xl"></div>
                <div className="bg-slate-950 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8 border border-white/5">
                  <Search className="h-10 w-10 text-slate-700" />
                </div>
                <h3 className="text-white text-2xl font-poppins font-bold mb-4">Aucun trésor trouvé</h3>
                <p className="text-slate-400 mb-10 leading-relaxed font-light">Nous n'avons trouvé aucun média correspondant à vos critères de recherche.</p>
                <button 
                  onClick={() => { setSearchTerm(''); setSelectedType('all'); setSelectedPeriod('all'); }} 
                  className="w-full bg-gradient-to-r from-teal-500 to-sky-500 text-white font-black uppercase tracking-widest px-8 py-5 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-teal-500/20"
                >
                  Tout réinitialiser
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
              {filteredMedia.map((media) => {
                const TypeIcon = getTypeIcon(media.media_type);
                const colorClass = getTypeColor(media.media_type);
                const accentColor = media.media_type === 'album' ? 'teal' : media.media_type === 'enregistrement' ? 'sky' : media.media_type === 'journal' ? 'slate' : 'indigo';
                
                return (
                  <div key={media.id} className="group relative bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-white/10 overflow-hidden hover:-translate-y-3 transition-all duration-700 hover:bg-slate-800/60 hover:border-white/20 shadow-2xl animate-fade-in">
                    <div className={`h-1.5 w-full bg-${accentColor}-500 group-hover:h-3 transition-all duration-700`}></div>
                    <div className="relative aspect-square overflow-hidden bg-slate-950">
                      <MediaPreview files={media.media_files} mediaType={media.media_type} onClick={() => openGallery(media)} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                      <div className="absolute top-4 left-4 z-20">
                        <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] ${colorClass} border border-white/20 shadow-2xl backdrop-blur-xl bg-slate-900/60`}>
                          <TypeIcon className="h-3.5 w-3.5 mr-2" />
                          {getTypeLabel(media.media_type)}
                        </span>
                      </div>
                      {media.is_featured && (
                        <div className="absolute top-4 right-4 bg-amber-400 text-white p-2.5 rounded-full shadow-2xl z-20 animate-pulse border-2 border-white/50">
                          <Star className="h-3.5 w-3.5 fill-current" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    </div>
                    <div className="p-6 relative text-center">
                      <div className="absolute -right-4 -bottom-4 opacity-[0.05] rotate-[15deg] group-hover:scale-125 group-hover:rotate-[25deg] transition-all duration-1000 text-white">
                        <TypeIcon className="h-24 w-24" />
                      </div>
                      <h3 className="font-poppins font-bold text-white text-base line-clamp-1 mb-3 group-hover:text-teal-400 transition-colors duration-500 relative z-10">{media.title}</h3>
                      <div className="flex items-center justify-center space-x-3 text-[10px] font-black uppercase tracking-widest text-slate-500 relative z-10">
                        <div className={`w-2 h-2 rounded-full bg-${accentColor}-400 shadow-lg shadow-${accentColor}-500/40`}></div>
                        <span>{media.media_files.length} {media.media_files.length > 1 ? 'FICHIERS' : 'FICHIER'}</span>
                        <span className="opacity-30">•</span>
                        <span className="bg-white/5 px-2 py-1 rounded-lg">
                          {media.media_date ? new Date(media.media_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : new Date(media.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Contribution Section */}
      <section id="contribute" className="py-24 relative overflow-hidden bg-slate-950 border-t border-white/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-500/5 rounded-full blur-[200px] pointer-events-none"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto rounded-[3.5rem] bg-slate-900/50 backdrop-blur-2xl border border-white/10 p-12 text-center shadow-2xl relative group overflow-hidden">
             <div className="relative z-10">
                <div className="flex items-center justify-center space-x-6 mb-12">
                  <div className="w-16 h-px bg-gradient-to-r from-transparent to-teal-500"></div>
                  <div className="bg-gradient-to-br from-teal-500 to-indigo-600 p-6 rounded-3xl shadow-2xl shadow-teal-500/30 transform group-hover:rotate-12 transition-transform duration-700">
                    <Camera className="h-10 w-10 text-white" />
                  </div>
                  <div className="w-16 h-px bg-gradient-to-l from-transparent to-teal-500"></div>
                </div>
                <h2 className="font-poppins font-bold text-4xl md:text-5xl text-white mb-8 tracking-tight">Partagez vos <span className="text-teal-400">Souvenirs</span></h2>
                <p className="text-slate-400 text-xl leading-relaxed mb-12 max-w-2xl mx-auto font-light">Aidez-nous à immortaliser l'histoire de notre harmonie en partageant vos archives, photos ou enregistrements.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <a href="mailto:contact@la-lyre.fr" className="w-full sm:w-auto bg-white text-slate-950 font-black uppercase tracking-[0.2em] px-12 py-5 rounded-2xl hover:bg-teal-50 transition-all duration-300 shadow-xl flex items-center justify-center space-x-3 group/btn">
                    <span>Nous écrire</span>
                    <ChevronRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                  </a>
                  <Link to="/contact" className="w-full sm:w-auto bg-slate-800 text-white font-black uppercase tracking-[0.2em] px-12 py-5 rounded-2xl hover:bg-slate-700 transition-all duration-300 border border-white/10">Page Contact</Link>
                </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Media;
