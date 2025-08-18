import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn } from 'lucide-react';

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

  if (!isOpen) return null;

  // Filtrer selon le type de média
  let displayFiles = [];
  if (media.media_type === 'album') {
    displayFiles = media.media_files.filter(file => file.file_type === 'image' || file.file_type === 'video');
  } else if (media.media_type === 'journal') {
    displayFiles = media.media_files.filter(file => file.file_type === 'image');
  } else {
    displayFiles = media.media_files.filter(file => file.file_type === 'image');
  }
  
  const imageFiles = displayFiles;
  const currentFile = imageFiles[currentIndex];

  // Fonction pour construire l'URL complète du fichier
  const getFileUrl = (filePath: string) => {
    if (filePath.startsWith('/uploads/')) {
      return `http://localhost:5173${filePath}`;
    }
    return filePath;
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % imageFiles.length);
    setIsZoomed(false);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + imageFiles.length) % imageFiles.length);
    setIsZoomed(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-6 z-10">
        <div className="flex items-center justify-between text-white">
          <div>
            <h2 className="font-poppins font-bold text-2xl">{media.title}</h2>
            <p className="text-gray-300 mt-1">
              {currentIndex + 1} / {imageFiles.length}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title={isZoomed ? "Zoom arrière" : "Zoom avant"}
            >
              <ZoomIn className="h-6 w-6" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Fermer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      {imageFiles.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 z-10"
            title="Image précédente"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 z-10"
            title="Image suivante"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      {/* Main image */}
      <div className="flex items-center justify-center w-full h-full p-20">
        {currentFile && (
          <img
            src={getFileUrl(currentFile.file_path)}
            alt={currentFile.alt_text || media.title}
            className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
              isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
            onError={(e) => {
              console.error('Erreur de chargement image galerie:', currentFile.file_path);
            }}
          />
        )}
      </div>

      {/* Thumbnails */}
      {imageFiles.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-6">
          <div className="flex justify-center space-x-2 overflow-x-auto">
            {imageFiles.map((file, index) => (
              <button
                key={file.id}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsZoomed(false);
                }}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  index === currentIndex 
                    ? 'border-white shadow-lg' 
                    : 'border-transparent hover:border-gray-400'
                }`}
              >
                <img
                  src={getFileUrl(file.file_path)}
                  alt={file.alt_text || `Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaGallery;