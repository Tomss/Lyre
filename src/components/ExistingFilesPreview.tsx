import React from 'react';
import { X, Image as ImageIcon, Music, FileText, File } from 'lucide-react';

interface MediaFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: 'image' | 'video' | 'audio' | 'pdf';
  alt_text: string | null;
  sort_order: number;
}

interface ExistingFilesPreviewProps {
  files: MediaFile[];
  onRemove: (fileId: string) => void;
  className?: string;
}

const ExistingFilesPreview: React.FC<ExistingFilesPreviewProps> = ({ files, onRemove, className = '' }) => {
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image': return ImageIcon;
      case 'audio': return Music;
      case 'pdf': return FileText;
      default: return File;
    }
  };

  const getFilePreview = (file: MediaFile) => {
    if (file.file_type === 'image') {
      return (
        <div key={file.id} className="relative group">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={file.file_path}
              alt={file.alt_text || file.file_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Erreur de chargement image existante:', file.file_path);
              }}
            />
          </div>
          <button
            onClick={() => onRemove(file.id)}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            title="Supprimer ce fichier"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mt-2">
            <p className="text-xs text-gray-600 truncate" title={file.file_name}>
              {file.file_name}
            </p>
            <p className="text-xs text-gray-400">
              Existant
            </p>
          </div>
        </div>
      );
    }

    // Pour les autres types de fichiers
    const Icon = getFileIcon(file.file_type);
    return (
      <div key={file.id} className="relative group">
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
        <button
          onClick={() => onRemove(file.id)}
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          title="Supprimer ce fichier"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mt-2">
          <p className="text-xs text-gray-600 truncate" title={file.file_name}>
            {file.file_name}
          </p>
          <p className="text-xs text-gray-400">
            {file.file_type.toUpperCase()}
          </p>
        </div>
      </div>
    );
  };

  if (files.length === 0) return null;

  return (
    <div className={className}>
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        Fichiers existants ({files.length})
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {files.map((file) => getFilePreview(file))}
      </div>
    </div>
  );
};

export default ExistingFilesPreview;