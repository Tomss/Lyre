import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Music, FileText } from 'lucide-react';
import { BASE_URL } from '../config';

interface MediaFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: 'image' | 'video' | 'audio' | 'pdf';
  alt_text: string | null;
  sort_order: number;
}

interface MediaItem {
  id: string;
  title: string;
  description: string | null;
  media_type: 'album' | 'enregistrement' | 'journal' | 'lyrissimot';
  media_files: MediaFile[];
}

interface MediaGalleryProps {
  media: MediaItem;
  isOpen: boolean;
  onClose: () => void;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({ media, isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const activeThumbRef = useRef<HTMLButtonElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Filter display files
  let displayFiles: MediaFile[] = [];
  if (media.media_type === 'album') {
    displayFiles = media.media_files.filter(file => file.file_type === 'image' || file.file_type === 'video');
  } else if (media.media_type === 'enregistrement') {
    displayFiles = media.media_files.filter(file => file.file_type === 'audio' || file.file_type === 'image');
  } else if (media.media_type === 'journal' || media.media_type === 'lyrissimot') {
    displayFiles = media.media_files.filter(file => file.file_type === 'pdf' || file.file_type === 'image');
  } else {
    displayFiles = media.media_files;
  }

  const currentFile = displayFiles[currentIndex];

  const getFileUrl = (filePath: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http') || filePath.startsWith('blob:')) {
      return filePath;
    }
    const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    return `${BASE_URL}${cleanPath}`;
  };

  // ⚡ FAST PRELOADING: Preload ONLY next image into memory
  useEffect(() => {
    if (!isOpen || displayFiles.length <= 1) return;
    const nextIndex = (currentIndex + 1) % displayFiles.length;
    const nextFile = displayFiles[nextIndex];
    if (nextFile && nextFile.file_type === 'image') {
      const img = new Image();
      img.src = getFileUrl(nextFile.file_path);
    }
  }, [currentIndex, isOpen, displayFiles]);

  // 🎯 Auto-center active thumbnail smoothly like Google Photos / LightGallery
  useEffect(() => {
    if (!isOpen) return;
    const scrollActiveIntoCenter = () => {
      if (stripRef.current && activeThumbRef.current) {
        const strip = stripRef.current;
        const thumb = activeThumbRef.current;
        const targetScrollLeft = thumb.offsetLeft - (strip.clientWidth / 2) + (thumb.clientWidth / 2);
        strip.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: 'smooth'
        });
      }
    };
    scrollActiveIntoCenter();
    const timer = setTimeout(scrollActiveIntoCenter, 60);
    return () => clearTimeout(timer);
  }, [currentIndex, isOpen]);

  const handleStripWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (stripRef.current) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        stripRef.current.scrollLeft += e.deltaY * 1.2;
      }
    }
  };

  // Reset state and attach global keyboard navigation when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setCurrentIndex(0);
    setIsZoomed(false);
    setIsImageLoaded(false);

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys if user is typing in an input
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsImageLoaded(false);
        setIsZoomed(false);
        setCurrentIndex((prev) => (prev + 1) % displayFiles.length);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsImageLoaded(false);
        setIsZoomed(false);
        setCurrentIndex((prev) => (prev - 1 + displayFiles.length) % displayFiles.length);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isOpen, displayFiles.length, onClose]);

  if (!isOpen) return null;

  const nextFile = () => {
    setIsImageLoaded(false);
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev + 1) % displayFiles.length);
  };

  const prevFile = () => {
    setIsImageLoaded(false);
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev - 1 + displayFiles.length) % displayFiles.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) > 50) {
      if (distance > 0) nextFile();
      else prevFile();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleDownload = async () => {
    if (!currentFile) return;
    const fileUrl = getFileUrl(currentFile.file_path);
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = currentFile.file_name || `media-${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[100] flex flex-col justify-between overflow-hidden select-none outline-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. HEADER BAR - Fixed Height & Non-overlapping */}
      <header className="h-16 flex-shrink-0 bg-slate-900/90 border-b border-white/10 px-4 md:px-8 flex items-center justify-between z-30">
        <div className="flex items-center space-x-3 truncate">
          <h2 className="text-white font-bold text-base md:text-lg truncate max-w-[250px] md:max-w-[500px]">
            {media.title}
          </h2>
          <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full text-xs font-black tracking-wider flex-shrink-0">
            {currentIndex + 1} / {displayFiles.length}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {currentFile?.file_type === 'image' && (
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
              title={isZoomed ? "Zoom arrière" : "Zoom avant"}
            >
              {isZoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
            </button>
          )}

          <button
            onClick={handleDownload}
            className="p-2.5 bg-white/10 hover:bg-teal-600 text-white rounded-xl transition-all"
            title="Télécharger l'image"
          >
            <Download size={18} />
          </button>

          <button
            onClick={onClose}
            className="p-2.5 bg-white/10 hover:bg-rose-600 text-white rounded-xl transition-all hover:rotate-90"
            title="Fermer (Échap)"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* 2. MAIN DISPLAY AREA - Capped Height so image never overflows or covers thumbnails */}
      <main className="flex-1 relative flex items-center justify-center p-4 md:p-8 min-h-0 z-20">
        {/* Navigation Arrows */}
        {displayFiles.length > 1 && (
          <>
            <button
              onClick={prevFile}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-teal-600 text-white p-3 md:p-4 rounded-2xl border border-white/20 shadow-xl transition-all z-30 group"
              title="Précédente (Flèche Gauche)"
            >
              <ChevronLeft size={28} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={nextFile}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-teal-600 text-white p-3 md:p-4 rounded-2xl border border-white/20 shadow-xl transition-all z-30 group"
              title="Suivante (Flèche Droite)"
            >
              <ChevronRight size={28} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </>
        )}

        {/* Media Render Target */}
        {currentFile && (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {!isImageLoaded && currentFile.file_type === 'image' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {currentFile.file_type === 'image' ? (
              <img
                src={getFileUrl(currentFile.file_path)}
                alt={currentFile.alt_text || media.title}
                loading="eager"
                decoding="async"
                onLoad={() => setIsImageLoaded(true)}
                className={`max-w-full max-h-[58vh] md:max-h-[64vh] object-contain rounded-2xl shadow-2xl transition-all duration-300 ${
                  isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                } ${isZoomed ? 'scale-150 cursor-zoom-out z-40' : 'cursor-zoom-in'}`}
                onClick={() => setIsZoomed(!isZoomed)}
              />
            ) : currentFile.file_type === 'pdf' ? (
              <div className="w-full max-w-4xl h-[60vh] bg-white rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                <iframe src={`${getFileUrl(currentFile.file_path)}#toolbar=1&view=FitH`} className="w-full h-full border-none" title={currentFile.file_name} />
              </div>
            ) : currentFile.file_type === 'video' ? (
              <video controls autoPlay src={getFileUrl(currentFile.file_path)} className="max-w-full max-h-[60vh] rounded-2xl shadow-2xl" />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-900 rounded-3xl border border-white/10 shadow-2xl">
                <Music className="h-16 w-16 text-teal-400 mb-4 animate-pulse" />
                <h3 className="text-white font-bold text-xl mb-4">{currentFile.file_name}</h3>
                <audio controls autoPlay src={getFileUrl(currentFile.file_path)} className="w-full max-w-md h-12" />
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. THUMBNAIL STRIP - Dedicated Bottom Bar with Modern Centered Lightbox Carousel */}
      {displayFiles.length > 1 && (
        <footer className="h-24 md:h-28 flex-shrink-0 bg-slate-950/95 backdrop-blur-md border-t border-white/10 px-4 md:px-8 py-3 flex items-center justify-center z-30 select-none">
          <div 
            ref={stripRef}
            onWheel={handleStripWheel}
            className="w-full max-w-6xl flex items-center space-x-3 overflow-x-auto py-2 no-scrollbar scroll-smooth"
          >
            {/* Centering spacer */}
            <div className="flex-shrink-0 w-[40vw] max-w-[240px]" />
            {displayFiles.map((file, index) => {
              const isSelected = index === currentIndex;

              return (
                <button
                  key={file.id || index}
                  ref={isSelected ? activeThumbRef : null}
                  onClick={() => {
                    setIsImageLoaded(false);
                    setIsZoomed(false);
                    setCurrentIndex(index);
                  }}
                  className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 transform cursor-pointer ${
                    isSelected 
                      ? 'border-teal-400 ring-4 ring-teal-400/40 scale-110 -translate-y-1 shadow-xl shadow-teal-500/30 z-10 opacity-100' 
                      : 'border-white/15 opacity-40 hover:opacity-85 hover:border-white/40 hover:scale-105'
                  }`}
                  title={file.file_name}
                >
                  {file.file_type === 'image' ? (
                    <img 
                      src={getFileUrl(file.file_path)} 
                      alt="" 
                      loading="lazy" 
                      decoding="async" 
                      className="w-full h-full object-cover pointer-events-none" 
                    />
                  ) : file.file_type === 'pdf' ? (
                    <div className="w-full h-full flex items-center justify-center bg-rose-600 text-white"><FileText size={20} /></div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-teal-600 text-white"><Music size={20} /></div>
                  )}
                  {isSelected && (
                    <span className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                      {index + 1}
                    </span>
                  )}
                </button>
              );
            })}
            {/* Centering spacer */}
            <div className="flex-shrink-0 w-[40vw] max-w-[240px]" />
          </div>
        </footer>
      )}
    </div>
  );
};

export default MediaGallery;
