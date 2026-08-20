import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Music, FileText, Maximize2 } from 'lucide-react';
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
  
  // Touch swipe tracking
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Filter files based on media type
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

  // Helper for full URL construction
  const getFileUrl = (filePath: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http') || filePath.startsWith('blob:')) {
      return filePath;
    }
    const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    return `${BASE_URL}${cleanPath}`;
  };

  // ⚡ PREDICTIVE PRELOADING ENGINE (Apple/Google Photos pattern)
  // Automatically preloads NEXT (N+1) and PREVIOUS (N-1) images into browser memory cache
  useEffect(() => {
    if (!isOpen || displayFiles.length <= 1) return;

    const nextIndex = (currentIndex + 1) % displayFiles.length;
    const prevIndex = (currentIndex - 1 + displayFiles.length) % displayFiles.length;

    const nextFile = displayFiles[nextIndex];
    const prevFile = displayFiles[prevIndex];

    if (nextFile && nextFile.file_type === 'image') {
      const imgNext = new Image();
      imgNext.src = getFileUrl(nextFile.file_path);
    }
    if (prevFile && prevFile.file_type === 'image') {
      const imgPrev = new Image();
      imgPrev.src = getFileUrl(prevFile.file_path);
    }
  }, [currentIndex, isOpen, displayFiles]);

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsZoomed(false);
      setIsImageLoaded(false);
    }
  }, [isOpen]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextFile();
    if (e.key === 'ArrowLeft') prevFile();
    if (e.key === 'Escape') onClose();
  };

  // Touch Swipe Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isSwipe = Math.abs(distance) > 50;

    if (isSwipe) {
      if (distance > 0) {
        nextFile(); // Swipe Left -> Next
      } else {
        prevFile(); // Swipe Right -> Prev
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Direct Download Trigger
  const handleDownload = async () => {
    if (!currentFile) return;
    const fileUrl = getFileUrl(currentFile.file_path);
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = currentFile.file_name || `lyre-media-${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(fileUrl, '_blank');
    }
  };

  const renderItem = () => {
    if (!currentFile) return null;
    const fileUrl = getFileUrl(currentFile.file_path);

    switch (currentFile.file_type) {
      case 'pdf':
        return (
          <div className="w-full h-full bg-white rounded-3xl overflow-hidden shadow-2xl relative border border-white/20">
            <iframe
              src={`${fileUrl}#toolbar=1&view=FitH`}
              className="w-full h-full border-none"
              title={currentFile.file_name}
            />
          </div>
        );
      
      case 'video':
        return (
          <video
            controls
            autoPlay
            src={fileUrl}
            className="max-w-full max-h-[80vh] rounded-3xl shadow-2xl border border-white/10"
          />
        );
      
      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center space-y-8 p-12 bg-slate-900/90 rounded-[3rem] border border-white/10 shadow-2xl">
            <div className="w-32 h-32 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-teal-500/30 animate-pulse">
               <Music className="h-16 w-16 text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-white font-bold text-2xl mb-2">{currentFile.file_name}</h3>
              <p className="text-teal-400 text-xs font-extrabold tracking-widest uppercase">Audio Session La Lyre</p>
            </div>
            <audio
              controls
              autoPlay
              src={fileUrl}
              className="w-full max-w-md h-12 rounded-full"
            />
          </div>
        );
      
      case 'image':
      default:
        return (
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            {/* Shimmer Placeholder while active image is decoding */}
            {!isImageLoaded && (
              <div className="absolute inset-0 min-w-[300px] min-h-[300px] bg-slate-900/60 rounded-3xl animate-pulse flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <img
              src={fileUrl}
              alt={currentFile.alt_text || media.title}
              loading="eager"
              decoding="async"
              onLoad={() => setIsImageLoaded(true)}
              className={`max-w-full max-h-[75vh] md:max-h-[82vh] object-contain rounded-2xl transition-all duration-300 shadow-2xl ${
                isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              } ${isZoomed ? 'scale-150 cursor-zoom-out z-40' : 'cursor-zoom-in'}`}
              onClick={() => setIsZoomed(!isZoomed)}
            />
          </div>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[100] flex flex-col justify-between overflow-hidden select-none outline-none"
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
    >
      {/* Header Bar - Floating Glassmorphism (Apple Style) */}
      <div className="w-full p-4 md:p-6 z-30 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Title & Counter Badge */}
          <div className="flex items-center space-x-4">
            <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-2 flex items-center space-x-3">
              <span className="text-white font-bold text-base md:text-lg tracking-tight truncate max-w-[200px] md:max-w-[400px]">
                {media.title}
              </span>
              <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-0.5 rounded-full text-xs font-black tracking-widest">
                {currentIndex + 1} / {displayFiles.length}
              </span>
            </div>
          </div>

          {/* Floating Actions */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {currentFile?.file_type === 'image' && (
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/10 transition-all duration-200"
                title={isZoomed ? "Zoom arrière" : "Zoom avant"}
              >
                {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
              </button>
            )}

            <button
              onClick={handleDownload}
              className="p-3 bg-white/10 hover:bg-teal-600 text-white rounded-2xl border border-white/10 transition-all duration-200"
              title="Télécharger le fichier"
            >
              <Download className="h-5 w-5" />
            </button>

            <button
              onClick={onClose}
              className="p-3 bg-white/10 hover:bg-rose-500 text-white rounded-2xl border border-white/10 transition-all duration-200 hover:rotate-90"
              title="Fermer (Échap)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

        </div>
      </div>

      {/* Navigation Arrow Buttons */}
      {displayFiles.length > 1 && (
        <>
          <button
            onClick={prevFile}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-teal-600 text-white p-4 md:p-5 rounded-3xl border border-white/15 shadow-2xl transition-all duration-200 z-30 group"
            title="Précédente (Flèche Gauche)"
          >
            <ChevronLeft className="h-7 w-7 group-hover:-translate-x-1 transition-transform" />
          </button>
          <button
            onClick={nextFile}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-teal-600 text-white p-4 md:p-5 rounded-3xl border border-white/15 shadow-2xl transition-all duration-200 z-30 group"
            title="Suivante (Flèche Droite)"
          >
            <ChevronRight className="h-7 w-7 group-hover:translate-x-1 transition-transform" />
          </button>
        </>
      )}

      {/* Main Content Area */}
      <div className="w-full flex-1 flex items-center justify-center p-4 md:p-12 relative z-20">
        {renderItem()}
      </div>

      {/* Bottom Thumbnail Bar - Google Photos Track Pattern */}
      {displayFiles.length > 1 && (
        <div className="w-full p-4 md:p-6 z-30 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent">
          <div className="max-w-4xl mx-auto flex items-center justify-center space-x-3 overflow-x-auto py-2 no-scrollbar">
            {displayFiles.map((file, index) => {
              const isSelected = index === currentIndex;
              return (
                <button
                  key={file.id || index}
                  onClick={() => {
                    setIsImageLoaded(false);
                    setIsZoomed(false);
                    setCurrentIndex(index);
                  }}
                  className={`relative flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                    isSelected 
                      ? 'border-teal-400 scale-110 shadow-[0_0_20px_rgba(13,148,136,0.6)] z-10' 
                      : 'border-white/15 opacity-40 hover:opacity-100 hover:border-white/40 hover:scale-105'
                  }`}
                >
                  {file.file_type === 'image' ? (
                    <img 
                      src={getFileUrl(file.file_path)} 
                      alt="" 
                      loading="lazy" 
                      decoding="async" 
                      className="w-full h-full object-cover" 
                    />
                  ) : file.file_type === 'pdf' ? (
                    <div className="w-full h-full flex items-center justify-center bg-rose-500/80 text-white"><FileText size={20} /></div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-teal-600/80 text-white"><Music size={20} /></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaGallery;
