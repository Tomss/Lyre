import React from 'react';
import { FileText, Music, Image as ImageIcon } from 'lucide-react';
import { getOptimizedImageUrl, getImageSrcSet } from '../utils/image';

interface MediaFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: 'image' | 'audio' | 'pdf' | 'video';
  alt_text: string | null;
}

interface MediaPreviewProps {
  files: MediaFile[];
  mediaType: 'album' | 'enregistrement' | 'journal' | 'lyrissimot';
  title?: string;
  onClick?: () => void;
  className?: string;
  width?: number;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ files: rawFiles, mediaType, title, onClick, className = '', width = 600 }) => {
  let files: MediaFile[] = [];
  if (typeof rawFiles === 'string') {
    try {
      files = JSON.parse(rawFiles);
    } catch (e) {
      files = [];
    }
  } else if (Array.isArray(rawFiles)) {
    files = rawFiles;
  }

  const imageFiles = files.filter(file => {
    if (!file || !file.file_path) return false;
    const type = (file.file_type || '').toLowerCase();
    const path = file.file_path.toLowerCase();
    return type === 'image' || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png') || path.endsWith('.webp') || path.endsWith('.avif');
  });

  const audioFiles = files.filter(file => {
    if (!file || !file.file_path) return false;
    const type = (file.file_type || '').toLowerCase();
    const path = file.file_path.toLowerCase();
    return type === 'audio' || path.endsWith('.mp3') || path.endsWith('.wav') || path.endsWith('.ogg');
  });

  const pdfFiles = files.filter(file => {
    if (!file || !file.file_path) return false;
    const type = (file.file_type || '').toLowerCase();
    const path = file.file_path.toLowerCase();
    return type === 'pdf' || path.endsWith('.pdf') || path.includes('.pdf') || type.includes('pdf');
  });

  const firstImage = imageFiles[0];
  const firstAudio = audioFiles[0];
  const firstPdf = pdfFiles[0];

  const imageCount = imageFiles.length;
  const audioCount = audioFiles.length;

  // Albums : photos et vidéos
  if (mediaType === 'album' && firstImage) {
    return (
      <div 
        className={`aspect-square w-full relative overflow-hidden group cursor-pointer ${className}`}
        onClick={onClick}
      >
        <img 
          src={getOptimizedImageUrl(firstImage.file_path, width, 80)} 
          srcSet={getImageSrcSet(firstImage.file_path)}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          alt={firstImage.alt_text || 'Album cover'} 
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200"></div>
        {imageCount > 1 && (
          <div className="absolute bottom-4 right-4 bg-slate-900/80 text-white text-xs font-medium px-2 py-1 rounded-lg">
            +{imageCount - 1} photo{imageCount > 2 ? 's' : ''}
          </div>
        )}
      </div>
    );
  }

  // Enregistrements : Lecteur audio
  if (mediaType === 'enregistrement' && firstAudio) {
    return (
      <div 
        className={`aspect-square w-full relative overflow-hidden group cursor-pointer bg-gradient-to-br from-sky-400 to-blue-600 ${className}`}
        onClick={onClick}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
          <div className="bg-white/20 p-4 rounded-full mb-4 group-hover:scale-105 transition-transform duration-200">
            <Music className="h-10 w-10 text-white" />
          </div>
          <span className="font-semibold text-center line-clamp-2">
            {firstAudio.file_name}
          </span>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200"></div>
        {audioCount > 1 && (
          <div className="absolute bottom-4 right-4 bg-slate-900/80 text-white text-xs font-medium px-2 py-1 rounded-lg">
            {audioCount} pistes
          </div>
        )}
      </div>
    );
  }

  // 1. Si une image de couverture existe (uploadée par l'admin), on l'affiche en priorité !
  if (firstImage) {
    return (
      <div 
        className={`aspect-square w-full relative overflow-hidden group cursor-pointer ${className}`}
        onClick={onClick}
      >
        <img 
          src={getOptimizedImageUrl(firstImage.file_path, width, 80)} 
          srcSet={getImageSrcSet(firstImage.file_path)}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          alt={firstImage.alt_text || title || 'Media preview'} 
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200"></div>
      </div>
    );
  }

  // 2. Sinon, si aucun visuel n'a été fourni mais qu'un PDF est présent : Mockup PDF
  if (firstPdf || mediaType === 'journal' || mediaType === 'lyrissimot') {
    return (
      <div 
        className={`aspect-square w-full relative overflow-hidden group cursor-pointer bg-white ${className}`}
        onClick={onClick}
      >
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
          {/* Document Icon Mockup */}
          <div className="relative mb-6">
            <div className="absolute -inset-4 bg-rose-50 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-all duration-500 scale-75 group-hover:scale-100"></div>
            <div className="relative bg-white shadow-xl rounded-2xl p-5 border border-slate-100 transition-transform duration-500 group-hover:-translate-y-2">
              <FileText className="h-10 w-10 text-rose-500" />
              <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">PDF</div>
            </div>
            
            {/* Page stack effect */}
            <div className="absolute -bottom-1 -right-1 w-full h-full bg-slate-100 -z-10 rounded-2xl transform translate-x-1 translate-y-1"></div>
            <div className="absolute -bottom-2 -right-2 w-full h-full bg-slate-50 -z-20 rounded-2xl transform translate-x-2 translate-y-2 opacity-50"></div>
          </div>

          <div className="text-center space-y-1">
             <span className="block font-bold text-slate-800 text-sm line-clamp-2 px-2">
               {title || "Consulter le document"}
             </span>
          </div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
    );
  }

  // Default empty state
  return (
    <div 
      className={`aspect-square w-full bg-slate-100 flex flex-col items-center justify-center text-slate-300 ${className}`}
      onClick={onClick}
    >
      <ImageIcon className="h-12 w-12 mb-2" />
      <span className="text-xs font-medium uppercase tracking-widest">Aucun média</span>
    </div>
  );
};

export default MediaPreview;
