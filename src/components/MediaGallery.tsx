import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, Music, FileText } from 'lucide-react';
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

  // Synchroniser l'index actuel avec l'ouverture pour s'assurer qu'on repart de 0
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsZoomed(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtrer selon le type de média pour être plus permissif
  let displayFiles: MediaFile[] = [];
  if (media.media_type === 'album') {
    // Albums : Images et Vidéos
    displayFiles = media.media_files.filter(file => file.file_type === 'image' || file.file_type === 'video');
  } else if (media.media_type === 'enregistrement') {
    // Enregistrements : Audios et potentiellement des images de pochette
    displayFiles = media.media_files.filter(file => file.file_type === 'audio' || file.file_type === 'image');
  } else if (media.media_type === 'journal' || media.media_type === 'lyrissimot') {
    // Presse & Lyrissimots : PDFs et Images
    displayFiles = media.media_files.filter(file => file.file_type === 'pdf' || file.file_type === 'image');
  } else {
    // Par défaut : Tous les fichiers
    displayFiles = media.media_files;
  }
  
  const currentFile = displayFiles[currentIndex];

  // Fonction pour construire l'URL complète du fichier avec la BASE_URL correcte
  const getFileUrl = (filePath: string) => {
    if (filePath.startsWith('http') || filePath.startsWith('blob:')) {
      return filePath;
    }
    // Si le chemin commence par /uploads/ ou uploads/, on s'assure d'avoir la BASE_URL du serveur
    const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    return `${BASE_URL}${cleanPath}`;
  };

  const nextFile = () => {
    setCurrentIndex((prev) => (prev + 1) % displayFiles.length);
    setIsZoomed(false);
  };

  const prevFile = () => {
    setCurrentIndex((prev) => (prev - 1 + displayFiles.length) % displayFiles.length);
    setIsZoomed(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextFile();
    if (e.key === 'ArrowLeft') prevFile();
    if (e.key === 'Escape') onClose();
  };

  // Rendu selon le type de fichier
  const renderItem = () => {
    if (!currentFile) return null;

    const fileUrl = getFileUrl(currentFile.file_path);

    switch (currentFile.file_type) {
      case 'pdf':
        return (
          <div className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-2xl relative">
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
            className="max-w-full max-h-full rounded-lg shadow-2xl"
          />
        );
      
      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center space-y-8 p-12 bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 shadow-2xl">
            <div className="w-32 h-32 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
               <Music className="h-16 w-16 text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-white font-poppins font-bold text-xl mb-2">{currentFile.file_name}</h3>
              <p className="text-teal-400 text-sm font-black tracking-widest uppercase italic">Audio Session</p>
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
          <img
            src={fileUrl}
            alt={currentFile.alt_text || media.title}
            className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
              isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
          />
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] flex items-center justify-center"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-6 z-10">
        <div className="flex items-center justify-between text-white max-w-7xl mx-auto">
          <div>
            <h2 className="font-poppins font-bold text-2xl tracking-tight">{media.title}</h2>
            <p className="text-white/60 text-sm font-semibold mt-1">
               Fichier {currentIndex + 1} sur {displayFiles.length}
            </p>
          </div>
          <div className="flex items-center space-x-6">
            {currentFile?.file_type === 'image' && (
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="p-3 hover:bg-white/10 rounded-2xl transition-all duration-300"
                title={isZoomed ? "Zoom arrière" : "Zoom avant"}
              >
                <ZoomIn className="h-6 w-6" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-3 bg-white/10 hover:bg-rose-500 text-white rounded-2xl transition-all duration-300 transform hover:rotate-90 group"
              title="Fermer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      {displayFiles.length > 1 && (
        <>
          <button
            onClick={prevFile}
            className="absolute left-8 top-1/2 transform -translate-y-1/2 bg-white/5 hover:bg-teal-500 text-white p-5 rounded-3xl transition-all duration-300 z-10 backdrop-blur-md border border-white/10 group"
          >
            <ChevronLeft className="h-8 w-8 group-hover:-translate-x-1 transition-transform" />
          </button>
          <button
            onClick={nextFile}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 bg-white/5 hover:bg-teal-500 text-white p-5 rounded-3xl transition-all duration-300 z-10 backdrop-blur-md border border-white/10 group"
          >
            <ChevronRight className="h-8 w-8 group-hover:translate-x-1 transition-transform" />
          </button>
        </>
      )}

      {/* Main Content Area */}
      <div className="w-full h-full flex items-center justify-center p-8 md:p-24 lg:p-32">
        {renderItem()}
      </div>

      {/* Thumbnails (Only for multi-file albums) */}
      {displayFiles.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
          <div className="flex justify-center space-x-3 overflow-x-auto pb-2">
            {displayFiles.map((file, index) => (
              <button
                key={file.id}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsZoomed(false);
                }}
                className={`flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                  index === currentIndex 
                    ? 'border-teal-400 scale-110 shadow-lg shadow-teal-500/20' 
                    : 'border-white/10 opacity-50 hover:opacity-100 hover:border-white/30'
                }`}
              >
                {file.file_type === 'image' ? (
                  <img src={getFileUrl(file.file_path)} alt="" className="w-full h-full object-cover" />
                ) : file.file_type === 'pdf' ? (
                  <div className="w-full h-full flex items-center justify-center bg-rose-500 text-white"><FileText size={24} /></div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-teal-600 text-white"><Music size={24} /></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaGallery;