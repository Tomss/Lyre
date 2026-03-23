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

interface SplitInfo {
  instrument_id: string;
  custom_name: string;
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
  const [splits, setSplits] = useState<Record<number, SplitInfo>>({});
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

  const getPageRangeStr = (startIndex: number) => {
    if (!numPages) return '';
    const sortedIndices = Object.keys(splits).map(Number).sort((a,b) => a - b);
    const nextIndex = sortedIndices.find(idx => idx > startIndex);
    const endPage = nextIndex ? nextIndex : numPages;
    const pageCount = endPage - startIndex;
    if (pageCount === 1) return `Page ${startIndex + 1} (1 page)`;
    return `Pages ${startIndex + 1} à ${endPage} (${pageCount} pages)`;
  };

  const handleInstrumentSelect = (pageIndex: number, instrumentId: string, customName: string) => {
    setSplits(prev => {
      const next = { ...prev };
      if (!instrumentId) {
        delete next[pageIndex];
      } else {
        next[pageIndex] = { instrument_id: instrumentId, custom_name: customName };
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
        .map(([page, info]) => ({
          start_page: parseInt(page) + 1, // 1-indexed for backend
          instrument_id: info.instrument_id,
          custom_name: info.custom_name
        }))
        .sort((a, b) => a.start_page - b.start_page);

      // Send the split command WITH the file directly in FormData
      const splitFormData = new FormData();
      splitFormData.append('file', selectedFile);
      splitFormData.append('morceau_id', selectedMorceauId);
      splitFormData.append('original_name', selectedFile.name);
      splitFormData.append('splits', JSON.stringify(sortedSplits));

      const response = await fetch(`${API_URL}/partitions/batch-split`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: splitFormData,
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
              {/* Left Column: Large Preview & Controls */}
              <div className="flex-1 bg-slate-100 flex flex-col relative overflow-hidden">
                <div className="flex-1 overflow-auto flex items-start justify-center p-4">
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
                
                {/* Navigation Buttons overlapping preview */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-50 hover:opacity-100 transition">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1}
                    className="p-3 bg-white text-slate-700 shadow-xl border border-slate-200 rounded-full disabled:opacity-30 transition hover:bg-slate-50"
                  >
                    ↑
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(numPages || 1, p + 1))} 
                    disabled={currentPage === numPages}
                    className="p-3 bg-white text-slate-700 shadow-xl border border-slate-200 rounded-full disabled:opacity-30 transition hover:bg-slate-50"
                  >
                    ↓
                  </button>
                </div>

                {/* Bottom Panel: Instrument Selection Buttons for CURRENT page */}
                <div className="bg-white border-t border-slate-200 p-5 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] flex-shrink-0 z-10 w-full">
                  <h4 className="text-sm font-bold text-slate-800 mb-3">Sélectionner l'instrument qui commence à la page {currentPage} :</h4>
                  <div className="flex flex-wrap gap-2 mb-4 max-h-[140px] overflow-y-auto p-1">
                    <button 
                      onClick={() => handleInstrumentSelect(currentPage - 1, '', '')} 
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${!splits[currentPage - 1] ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
                    >
                      Aucun changement de page ici
                    </button>
                    <button 
                      onClick={() => handleInstrumentSelect(currentPage - 1, '_IGNORE_', 'Pages ignorées')} 
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${splits[currentPage - 1]?.instrument_id === '_IGNORE_' ? 'bg-red-600 border-red-700 text-white shadow-md ring-2 ring-red-200' : 'bg-white border-slate-200 text-red-600 hover:bg-red-50 border hover:border-red-300'}`}
                    >
                      🚫 Ignorer à partir d'ici (Ne rien générer)
                    </button>
                    {instruments.map(inst => {
                      const isSelected = splits[currentPage - 1]?.instrument_id === inst.id;
                      return (
                        <button 
                          key={inst.id} 
                          onClick={() => handleInstrumentSelect(currentPage - 1, inst.id, inst.name)} 
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition border flex-shrink-0 ${isSelected ? 'bg-indigo-600 border-indigo-700 text-white shadow-md ring-2 ring-indigo-200' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50'}`}
                        >
                          {inst.name}
                        </button>
                      );
                    })}
                  </div>
                  
                  {splits[currentPage - 1] && splits[currentPage - 1].instrument_id !== '_IGNORE_' && (
                    <div className="flex flex-col md:flex-row md:items-center gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 animate-in slide-in-from-bottom-2">
                      <label className="text-sm font-semibold text-indigo-900 whitespace-nowrap">Nom de la partition générée :</label>
                      <input 
                        type="text" 
                        value={splits[currentPage - 1].custom_name}
                        onChange={(e) => handleInstrumentSelect(currentPage - 1, splits[currentPage - 1].instrument_id, e.target.value)}
                        className="flex-1 px-4 py-2 text-sm rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm font-medium"
                        placeholder="Ex: Flûte 1"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Scrollable list of pages overview */}
              <div className="w-full md:w-[280px] border-l border-slate-200 bg-slate-50 flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-slate-200 bg-white shadow-sm z-10">
                  <h3 className="text-sm font-bold text-slate-800">Vue d'ensemble</h3>
                  <p className="text-xs text-slate-500 mt-1">{Object.keys(splits).length} partition(s) prêtes à découper</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
                  {numPages && Array.from(new Array(numPages), (_, index) => {
                    const pageNum = index + 1;
                    const isSelected = currentPage === pageNum;
                    const splitInfo = splits[index];
                    
                    return (
                      <div 
                        key={`page_list_${pageNum}`} 
                        onClick={() => setCurrentPage(pageNum)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                          isSelected ? 'border-indigo-500 bg-white shadow-md ring-1 ring-indigo-500 scale-[1.02]' : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`font-bold text-sm ${isSelected ? 'text-indigo-700' : 'text-slate-600'}`}>Page {pageNum}</span>
                          {splitInfo?.instrument_id === '_IGNORE_' ? (
                            <span className="text-[10px] w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold">🚫</span>
                          ) : splitInfo && (
                            <CheckCircle size={16} className="text-emerald-500 drop-shadow-sm" />
                          )}
                        </div>
                        {splitInfo?.instrument_id === '_IGNORE_' ? (
                          <div className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100 flex flex-col gap-0.5">
                            <div className="flex items-center"><span className="mr-1.5">🚫</span> {splitInfo.custom_name}</div>
                            <div className="text-[10px] text-red-500 font-medium">Ne sera pas généré ({getPageRangeStr(index)})</div>
                          </div>
                        ) : splitInfo && (
                          <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 flex flex-col gap-0.5">
                            <div className="flex items-center"><span className="mr-1.5">✂️</span> {splitInfo.custom_name}</div>
                            <div className="text-[10px] text-emerald-600 font-medium">{getPageRangeStr(index)}</div>
                          </div>
                        )}
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
