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
  onClick?: () => void;
  className?: string;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ files, mediaType, onClick, className = '' }) => {
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

  // Journaux & Lyrissimots : PDF
  if ((mediaType === 'journal' || mediaType === 'lyrissimot') && firstPdf) {
    return (
      <div 
        className={`aspect-square w-full relative overflow-hidden group cursor-pointer bg-slate-50 border border-slate-100 ${className}`}
        onClick={onClick}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          <div className="bg-rose-50 p-4 rounded-2xl mb-4 group-hover:bg-rose-100 transition-colors duration-300">
            <FileText className="h-12 w-12 text-rose-500" />
          </div>
          <span className="font-poppins font-medium text-slate-700 text-center line-clamp-2 text-sm">
            {firstPdf.file_name}
          </span>
          <span className="mt-2 px-2 py-1 bg-rose-500 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
            PDF
          </span>
        </div>
        <div className="absolute inset-0 bg-rose-500/0 group-hover:bg-rose-500/5 transition-colors duration-300"></div>
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