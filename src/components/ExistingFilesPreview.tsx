import React, { useState } from 'react';
import { X, Image as ImageIcon, Music, FileText, Search } from 'lucide-react';

interface MediaFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: 'image' | 'audio' | 'pdf' | 'video';
  alt_text: string | null;
}

interface ExistingFilesPreviewProps {
  files: MediaFile[];
  onRemove: (fileId: string) => void;
}

const ExistingFilesPreview: React.FC<ExistingFilesPreviewProps> = ({ files, onRemove }) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!files || files.length === 0) return null;

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return ImageIcon;
      case 'audio': return Music;
      case 'pdf': return FileText;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-slate-700 flex items-center">
        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-2"></span>
        Fichiers existants ({files.length})
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {files.map((file) => {
          const Icon = getFileIcon(file.file_type);
          
          return (
            <div 
              key={file.id} 
              className="group relative aspect-square bg-slate-50 rounded-xl border border-slate-200 overflow-hidden hover:border-teal-300 transition-all duration-300 shadow-sm"
            >
              {file.file_type === 'image' ? (
                <div 
                    className="w-full h-full cursor-zoom-in"
                    onClick={() => setPreviewImage(file.file_path)}
                >
                    <img 
                    src={file.file_path} 
                    alt={file.alt_text || file.file_name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={() => {
                        console.error('Erreur de chargement image existante:', file.file_path);
                    }}
                    />
                    {/* Overlay au survol */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Search className="text-white h-5 w-5" />
                    </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2">
                  <div className={`p-2 rounded-lg mb-1 ${
                    file.file_type === 'pdf' ? 'bg-rose-50 text-rose-500' : 
                    file.file_type === 'audio' ? 'bg-sky-50 text-sky-500' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] text-slate-500 text-center line-clamp-2 px-1 break-all">
                    {file.file_name}
                  </span>
                </div>
              )}
              
              {/* Overlay d'actions (Supprimer) */}
              <div className="absolute top-2 right-2 flex space-x-1.5 z-10">
                <button
                  type="button"
                  onClick={(e) => {
                      e.stopPropagation();
                      onRemove(file.id);
                  }}
                  className="p-1.5 bg-white/90 hover:bg-white text-rose-500 rounded-full shadow-lg transform scale-90 hover:scale-100 transition-all duration-200 opacity-0 group-hover:opacity-100"
                  title="Supprimer ce fichier"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Badge de type */}
              <div className="absolute top-2 left-2 pointer-events-none">
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shadow-sm ${
                  file.file_type === 'image' ? 'bg-teal-500 text-white' :
                  file.file_type === 'pdf' ? 'bg-rose-500 text-white' :
                  file.file_type === 'audio' ? 'bg-sky-500 text-white' : 'bg-slate-500 text-white'
                }`}>
                  {file.file_type}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Preview */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
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

export default ExistingFilesPreview;