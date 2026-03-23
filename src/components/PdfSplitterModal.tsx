import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { API_URL } from '../config';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Morceau {
  id: string;
  nom: string;
}

interface Instrument {
  id: string;
  name: string;
}

interface PdfSplitterModalProps {
  isOpen: boolean;
  onClose: () => void;
  morceaux: Morceau[];
  instruments: Instrument[];
  onSuccess: () => void;
  token: string | null;
}

export const PdfSplitterModal: React.FC<PdfSplitterModalProps> = ({
  isOpen,
  onClose,
  morceaux,
  instruments,
  onSuccess,
  token
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMorceauId, setSelectedMorceauId] = useState<string>('');
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [splits, setSplits] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setSelectedMorceauId('');
      setNumPages(null);
      setCurrentPage(1);
      setSplits({});
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleInstrumentSelect = (pageIndex: number, instrumentId: string) => {
    setSplits(prev => {
      const next = { ...prev };
      if (!instrumentId) {
        delete next[pageIndex];
      } else {
        next[pageIndex] = instrumentId;
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!token || !selectedFile || !selectedMorceauId || Object.keys(splits).length === 0) return;
    
    setLoading(true);
    setError(null);

    try {
      // Sort splits by page index
      const sortedSplits = Object.entries(splits)
        .map(([page, instrument_id]) => ({
          start_page: parseInt(page) + 1, // 1-indexed for backend
          instrument_id
        }))
        .sort((a, b) => a.start_page - b.start_page);

      // 1. Upload the PDF file first
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);

      const uploadRes = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadFormData,
      });

      if (!uploadRes.ok) throw new Error('Erreur lors du téléchargement du PDF.');
      const uploadData = await uploadRes.json();
      const filePath = uploadData.filePath;

      // 2. Send the split command
      const response = await fetch(`${API_URL}/partitions/batch-split`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          morceau_id: selectedMorceauId,
          file_path: filePath,
          original_name: selectedFile.name,
          splits: sortedSplits
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Erreur lors du découpage du PDF.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[90vh] overflow-hidden border border-white animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-white border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-4">
              <FileText size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Découpage de PDF (Mode Rapide)</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex flex-col gap-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start text-sm border border-red-200">
              <AlertTriangle className="mr-3 flex-shrink-0 mt-0.5" size={16} />
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <label className="block text-sm font-semibold text-slate-700 mb-2">1. Choisir le Morceau cible</label>
              <select 
                value={selectedMorceauId} 
                onChange={e => setSelectedMorceauId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50 transition"
              >
                <option value="">Sélectionnez un morceau...</option>
                {morceaux.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
              </select>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <label className="block text-sm font-semibold text-slate-700 mb-2">2. Uploader le PDF du Livret</label>
              {!selectedFile ? (
                <label className="flex items-center justify-center w-full h-12 px-4 border-2 border-dashed border-indigo-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition cursor-pointer text-indigo-600 font-medium text-sm">
                  <Upload size={18} className="mr-2" /> Parcourir...
                  <input type="file" accept=".pdf" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                </label>
              ) : (
                <div className="flex items-center justify-between w-full h-12 px-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-medium">
                  <span className="truncate">{selectedFile.name}</span>
                  <button onClick={() => setSelectedFile(null)} className="ml-2 hover:text-emerald-900"><X size={16} /></button>
                </div>
              )}
            </div>
          </div>

          {selectedFile && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col md:flex-row overflow-hidden min-h-[500px]">
              {/* Left Column: Large Preview */}
              <div className="flex-1 bg-slate-100 flex flex-col p-4 relative">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex-shrink-0">3. Aperçu de la page {currentPage} sur {numPages}</h3>
                <div className="flex-1 overflow-auto flex items-start justify-center pb-4 rounded-xl">
                  <Document
                    file={selectedFile}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={(err) => setError("Erreur de chargement du PDF: " + err.message)}
                  >
                    {numPages && (
                      <Page 
                        pageNumber={currentPage} 
                        width={450} 
                        renderTextLayer={false} 
                        renderAnnotationLayer={false}
                        className="shadow-2xl border border-slate-200"
                      />
                    )}
                  </Document>
                </div>
                {/* Navigation Buttons */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center bg-white shadow-xl border border-slate-200 rounded-full px-2 py-1">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1}
                    className="p-2 hover:bg-slate-100 rounded-full disabled:opacity-30 transition"
                  >
                    Précédent
                  </button>
                  <span className="px-4 font-bold text-slate-700">{currentPage} / {numPages}</span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(numPages || 1, p + 1))} 
                    disabled={currentPage === numPages}
                    className="p-2 hover:bg-slate-100 rounded-full disabled:opacity-30 transition"
                  >
                    Suivant
                  </button>
                </div>
              </div>

              {/* Right Column: Scrollable list of pages to assign instruments */}
              <div className="w-full md:w-[350px] border-l border-slate-200 bg-white flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-sm font-semibold text-slate-700">4. Associer les instruments</h3>
                  <p className="text-xs text-slate-500 mt-1">Sélectionnez l'instrument correpondant sous la page où il commence (le système découpera jusqu'à l'instrument suivant peu importe le nombre de pages).</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {numPages && Array.from(new Array(numPages), (_, index) => {
                    const pageNum = index + 1;
                    const isSelected = currentPage === pageNum;
                    const assignedInstrumentId = splits[index];
                    
                    return (
                      <div 
                        key={`page_list_${pageNum}`} 
                        onClick={() => setCurrentPage(pageNum)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected ? 'border-indigo-500 bg-indigo-50 shadow-sm ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className={`font-bold text-sm ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>Page {pageNum}</span>
                          {assignedInstrumentId && (
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center">
                              <CheckCircle size={10} className="mr-1" />
                              Instrument assigné
                            </span>
                          )}
                        </div>
                        
                        <select
                          value={splits[index] || ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleInstrumentSelect(index, e.target.value)}
                          className={`w-full text-xs p-2.5 rounded-lg border outline-none font-medium transition cursor-pointer ${
                            splits[index] ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <option value="">-- Aucun début d'instrument ici --</option>
                          {instruments.map(inst => (
                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-slate-100 flex justify-between flex-shrink-0 items-center">
          <div className="text-sm text-slate-500 font-medium">
            {Object.keys(splits).length > 0 && (
              <span className="flex items-center text-indigo-600"><CheckCircle size={16} className="mr-1.5" /> {Object.keys(splits).length} partition(s) prêtes à être générées</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-slate-500 hover:text-slate-700 font-bold transition hover:bg-slate-50 rounded-xl text-sm"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || !selectedFile || !selectedMorceauId || Object.keys(splits).length === 0}
              className="px-8 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold transition shadow-lg shadow-indigo-200 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div> Génération...</>
              ) : 'Générer les Partitions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
