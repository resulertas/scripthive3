import React, { useState } from 'react';
import { X, RefreshCcw, Copy, Trash2, CheckCircle2 } from 'lucide-react';
import { BinItem } from '../types';

interface BinModalProps {
  isOpen: boolean;
  onClose: () => void;
  bin: BinItem[];
  setBin: React.Dispatch<React.SetStateAction<BinItem[]>>;
  onRestore: (item: BinItem) => void;
  theme: 'dark' | 'light';
}

export default function BinModal({ isOpen, onClose, bin, setBin, onRestore, theme }: BinModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const bgClass = theme === 'dark' ? 'bg-[#1a1f25]' : 'bg-[#FFFFF0]';
  const headerBg = theme === 'dark' ? 'bg-[#20272e] border-[#2d3640]' : 'bg-[#e8e0d5] border-[#c8bea8]';
  const textClass = theme === 'dark' ? 'text-slate-200' : 'text-slate-900';
  const borderClass = theme === 'dark' ? 'border-[#2d3640]' : 'border-[#c8bea8]';
  const cardBgClass = theme === 'dark' ? 'bg-[#252c33]' : 'bg-[#f4efe4]';

  const handleCopy = (item: BinItem) => {
    navigator.clipboard.writeText(item.element.content);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearBin = () => {
    if (window.confirm('Çöp Kutusunu tamamen boşaltmak istediğinize emin misiniz?')) {
      setBin([]);
    }
  };

  const handleDeleteItem = (id: string) => {
    setBin(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden ${bgClass} border ${borderClass}`}>
        
        <div className={`flex items-center justify-between p-4 border-b ${headerBg}`}>
          <div className="flex items-center gap-2 text-base font-bold">
            <Trash2 size={20} className={theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700'} />
            <span className={textClass}>Senaryo Çöp Kutusu</span>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-[#252c33] text-slate-400 hover:text-white' : 'hover:bg-[#dfd7ca] text-slate-600 hover:text-black'}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {bin.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-12 text-center opacity-50`}>
              <Trash2 size={48} className="mb-4 opacity-50" />
              <p>Çöp kutusu boş.</p>
              <p className="text-sm mt-2 max-w-md">Silinen her diyalog, eylem veya karakter buraya taşınır. İstediğiniz zaman geri getirebilirsiniz.</p>
            </div>
          ) : (
            bin.map((item) => (
              <div key={item.id} className={`p-4 rounded-xl border ${borderClass} ${cardBgClass} flex flex-col gap-3 group relative`}>
                <div className="flex items-center justify-between">
                  <div className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 opacity-60`}>
                    <span className={`px-2 py-0.5 rounded-full ${item.type === 'alternative' ? (theme === 'dark' ? 'bg-[#6ba3e8]/20 text-[#6ba3e8]' : 'bg-blue-100 text-blue-800') : 'bg-red-500/15 text-red-400'}`}>
                      {item.type === 'alternative' ? 'ALTERNATİF' : 'SİLİNEN'}
                    </span>
                    <span>{item.element.type}</span>
                    <span>&bull;</span>
                    <span>{new Date(item.deletedAt).toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(item)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        copiedId === item.id 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : theme === 'dark' ? 'bg-[#1a1f25] hover:bg-[#2d3640] text-slate-300' : 'bg-[#FFFFF0] border border-[#c8bea8] hover:bg-[#dfd7ca] text-slate-800'
                      }`}
                      title="Metni Kopyala"
                    >
                      {copiedId === item.id ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                      {copiedId === item.id ? 'Kopyalandı' : 'Kopyala'}
                    </button>
                    <button
                      onClick={() => onRestore(item)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 font-bold hover:bg-[#82b4f0]' : 'bg-blue-700 text-white font-bold hover:bg-blue-800'}`}
                      title="Geri Dönüştür"
                    >
                      <RefreshCcw size={14} /> Geri Dönüştür
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all text-red-500 hover:bg-red-500/20 ml-2"
                      title="Kalıcı Olarak Sil"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                
                <div className={`text-sm whitespace-pre-wrap font-mono ${textClass}`}>
                  {item.element.content || '(Boş metin)'}
                </div>
              </div>
            ))
          )}
        </div>

        {bin.length > 0 && (
          <div className={`p-4 border-t flex justify-between items-center ${borderClass} ${headerBg}`}>
            <div className="text-xs opacity-60">
              Toplam {bin.length} öğe
            </div>
            <button
              onClick={handleClearBin}
              className="text-xs text-red-500 hover:underline flex items-center gap-1 font-semibold"
            >
              <Trash2 size={14} /> Tümünü Sil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
