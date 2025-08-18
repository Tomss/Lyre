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
  const imageCount = files.filter(file => file.file_type === 'image').length;

  if (mediaType === 'album' && firstImage) {
    return (
      <div 
        className={`relative group cursor-pointer ${className}`}
        onClick={onClick}
      >
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={firstImage.file_path}
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

  // Pour les autres types de médias
  const getPreviewContent = () => {
    switch (mediaType) {
      case 'enregistrement':
        return (
          <div className="aspect-video bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Music className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-700 font-medium">
                {files.filter(f => f.file_type === 'audio').length} audio{files.filter(f => f.file_type === 'audio').length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        );
      case 'journal':
        return firstImage ? (
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={firstImage.file_path}
              alt={firstImage.alt_text || 'Article de journal'}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
            <FileText className="h-12 w-12 text-yellow-600" />
          </div>
        );
      case 'lyrissimot':
        return (
          <div className="aspect-video bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <File className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-purple-700 font-medium">
                {files.filter(f => f.file_type === 'pdf').length} PDF
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
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