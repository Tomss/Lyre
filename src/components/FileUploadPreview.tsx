import React, { useState } from 'react';
import { X, Image as ImageIcon, Music, FileText, File, Search } from 'lucide-react';

interface FileUploadPreviewProps {
  files: File[];
  onRemove: (index: number) => void;
  className?: string;
}

const FileUploadPreview: React.FC<FileUploadPreviewProps> = ({ files, onRemove, className = '' }) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
          <div 
            className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in"
            onClick={() => setPreviewImage(imageUrl)}
          >
            <img
              src={imageUrl}
              alt={file.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              onLoad={() => {
                // We keep the URL for the preview, but we should be careful about memory.
                // In a real app we might want to manage this better.
              }}
            />
            {/* Overlay au survol */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Search className="text-white h-6 w-6" />
            </div>
          </div>
          
          <button
            onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
            }}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md z-10"
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
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md"
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

      {/* Lightbox Preview */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors p-2 bg-white/10 rounded-full"
            onClick={() => setPreviewImage(null)}
          >
            <X className="h-8 w-8" />
          </button>
          <img 
            src={previewImage} 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
            alt="Preview" 
          />
        </div>
      )}
    </div>
  );
};

export default FileUploadPreview;