import React from 'react';
import { X, Image as ImageIcon, Music, FileText, File } from 'lucide-react';

interface FileUploadPreviewProps {
  files: File[];
  onRemove: (index: number) => void;
  className?: string;
}

const FileUploadPreview: React.FC<FileUploadPreviewProps> = ({ files, onRemove, className = '' }) => {
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return ImageIcon;
    if (file.type.startsWith('audio/')) return Music;
    if (file.type === 'application/pdf') return FileText;
    return File;
  };

  const getFilePreview = (file: File, index: number) => {
    if (file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      return (
        <div key={index} className="relative group">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={imageUrl}
              alt={file.name}
              className="w-full h-full object-cover"
              onLoad={() => URL.revokeObjectURL(imageUrl)}
            />
          </div>
          <button
            onClick={() => onRemove(index)}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            title="Supprimer"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mt-2">
            <p className="text-xs text-gray-600 truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-gray-400">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      );
    }

    // Pour les autres types de fichiers
    const Icon = getFileIcon(file);
    return (
      <div key={index} className="relative group">
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
        <button
          onClick={() => onRemove(index)}
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          title="Supprimer"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mt-2">
          <p className="text-xs text-gray-600 truncate" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-gray-400">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>
    );
  };

  if (files.length === 0) return null;

  return (
    <div className={className}>
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        Fichiers sélectionnés ({files.length})
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {files.map((file, index) => getFilePreview(file, index))}
      </div>
    </div>
  );
};

export default FileUploadPreview;