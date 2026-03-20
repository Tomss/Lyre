import React from 'react';
import { FileText, Music, Image as ImageIcon } from 'lucide-react';

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
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ files, mediaType, title, onClick, className = '' }) => {
  const imageFiles = files.filter(file => file.file_type === 'image');
  const audioFiles = files.filter(file => file.file_type === 'audio');
  const pdfFiles = files.filter(file => file.file_type === 'pdf');

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
          src={firstImage.file_path} 
          alt={firstImage.alt_text || 'Album cover'} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
        {imageCount > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-medium px-2 py-1 rounded-lg">
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
          <div className="bg-white/20 backdrop-blur-md p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
            <Music className="h-10 w-10 text-white" />
          </div>
          <span className="font-poppins font-semibold text-center line-clamp-2">
            {firstAudio.file_name}
          </span>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
        {audioCount > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md text-white text-xs font-medium px-2 py-1 rounded-lg">
            {audioCount} pistes
          </div>
        )}
      </div>
    );
  }

  // Journaux & Lyrissimots : PDF (Design Premium Mockup)
  if ((mediaType === 'journal' || mediaType === 'lyrissimot') && firstPdf) {
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
             <span className="block font-poppins font-bold text-slate-800 text-sm line-clamp-2 px-2">
               {title || "Consulter le document"}
             </span>
             <span className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-rose-500 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
               Cliquer pour lire
             </span>
          </div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
    );
  }

  // Fallback / Journal avec Image
  if (firstImage) {
    return (
      <div 
        className={`aspect-square w-full relative overflow-hidden group cursor-pointer ${className}`}
        onClick={onClick}
      >
        <img 
          src={firstImage.file_path} 
          alt={firstImage.alt_text || 'Media preview'} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
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