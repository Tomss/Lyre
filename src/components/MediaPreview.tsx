import React from 'react';
import { Play, FileText, Music, Image as ImageIcon, File } from 'lucide-react';

interface MediaFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: 'image' | 'video' | 'audio' | 'pdf';
  alt_text: string | null;
  sort_order: number;
}

interface MediaPreviewProps {
  files: MediaFile[];
  mediaType: 'album' | 'enregistrement' | 'journal' | 'lyrissimot';
  className?: string;
  onClick?: () => void;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ files, mediaType, className = '', onClick }) => {
  const firstImage = files.find(file => file.file_type === 'image');
  const firstAudio = files.find(file => file.file_type === 'audio');
  const firstPdf = files.find(file => file.file_type === 'pdf');
  const imageCount = files.filter(file => file.file_type === 'image').length;
  const audioCount = files.filter(file => file.file_type === 'audio').length;

  // Fonction pour construire l'URL complète du fichier
  const getFileUrl = (filePath: string) => {
    // Si le chemin commence par /uploads/, on utilise l'URL du serveur local
    if (filePath.startsWith('/uploads/')) {
      return `http://localhost:5173${filePath}`;
    }
    // Sinon on retourne le chemin tel quel
    return filePath;
  };

  // Albums : photos et vidéos
  if (mediaType === 'album' && firstImage) {
    return (
      <div 
        className={`relative group cursor-pointer ${className}`}
        onClick={onClick}
      >
        <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={getFileUrl(firstImage.file_path)}
            alt={firstImage.alt_text || 'Aperçu album'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              console.error('Erreur de chargement image:', firstImage.file_path);
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Overlay avec nombre de photos */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {imageCount} photo{imageCount > 1 ? 's' : ''}
            </div>
          </div>
          {/* Icône play pour indiquer que c'est cliquable */}
          <div className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ImageIcon className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  }

  // Enregistrements : fichiers audio
  if (mediaType === 'enregistrement' && firstAudio) {
    return (
      <div 
        className={`relative group cursor-pointer ${className}`}
        onClick={onClick}
      >
        <div className="aspect-[4/3] bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="bg-green-600/20 p-4 rounded-full mb-3 mx-auto w-fit group-hover:bg-green-600/30 transition-colors duration-300">
              <Play className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-green-700 font-medium">
              {audioCount} audio{audioCount > 1 ? 's' : ''}
            </p>
          </div>
          {/* Icône play pour indiquer que c'est cliquable */}
          <div className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Play className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  }

  // Journaux : image ou PDF d'article
  if (mediaType === 'journal') {
    if (firstImage) {
      return (
        <div 
          className={`relative group cursor-pointer ${className}`}
          onClick={onClick}
        >
          <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={getFileUrl(firstImage.file_path)}
              alt={firstImage.alt_text || 'Article de journal'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <FileText className="h-4 w-4" />
            </div>
          </div>
        </div>
      );
    } else if (firstPdf) {
      return (
        <div 
          className={`relative group cursor-pointer ${className}`}
          onClick={onClick}
        >
          <div className="aspect-[4/3] bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="bg-yellow-600/20 p-4 rounded-full mb-3 mx-auto w-fit group-hover:bg-yellow-600/30 transition-colors duration-300">
                <FileText className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="text-sm text-yellow-700 font-medium">Article PDF</p>
            </div>
            <div className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <FileText className="h-4 w-4" />
            </div>
          </div>
        </div>
      );
    }
  }

  // Lyrissimots : PDF uniquement
  if (mediaType === 'lyrissimot' && firstPdf) {
    return (
      <div 
        className={`relative group cursor-pointer ${className}`}
        onClick={onClick}
      >
        <div className="aspect-[4/3] bg-gradient-to-br from-slate-400 via-slate-500 to-gray-600 rounded-lg flex items-center justify-center relative overflow-hidden">
          {/* Pattern de fond décoratif */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 left-2 w-8 h-8 border-2 border-white rounded-full"></div>
            <div className="absolute top-6 right-4 w-4 h-4 border border-white rounded-full"></div>
            <div className="absolute bottom-4 left-6 w-6 h-6 border border-white rounded-full"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 bg-white rounded-full"></div>
          </div>
          <div className="text-center">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full mb-3 mx-auto w-fit group-hover:bg-white/30 transition-all duration-300 border border-white/30">
              <Music className="h-10 w-10 text-white drop-shadow-lg" />
            </div>
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
              <p className="text-sm text-slate-800 font-bold">Lyrissimot</p>
            </div>
          </div>
          <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-white/30">
            <Music className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  }
  // Pour les autres types de médias
  const getPreviewContent = () => {
    switch (mediaType) {
      case 'enregistrement':
        return (
          <div className="aspect-[4/3] bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Music className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-700 font-medium">
                Aucun audio
              </p>
            </div>
          </div>
        );
      case 'journal':
        return (
          <div className="aspect-[4/3] bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm text-yellow-700 font-medium">Aucun fichier</p>
            </div>
          </div>
        );
      case 'lyrissimot':
        return (
          <div className="aspect-[4/3] bg-gradient-to-br from-slate-400 via-slate-500 to-gray-600 rounded-lg flex items-center justify-center relative overflow-hidden">
            {/* Pattern de fond décoratif */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 left-2 w-8 h-8 border-2 border-white rounded-full"></div>
              <div className="absolute top-6 right-4 w-4 h-4 border border-white rounded-full"></div>
              <div className="absolute bottom-4 left-6 w-6 h-6 border border-white rounded-full"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 bg-white rounded-full"></div>
            </div>
            <div className="text-center">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full mb-3 mx-auto w-fit border border-white/30">
                <Music className="h-10 w-10 text-white drop-shadow-lg" />
              </div>
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                <p className="text-sm text-purple-800 font-bold">
                <p className="text-sm text-slate-800 font-bold">
                  Aucun PDF
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-400" />
          </div>
        );
    }
  };

  return (
    <div className={`${className}`} onClick={onClick}>
      {getPreviewContent()}
    </div>
  );
};

export default MediaPreview;
        )
    }
  }
}