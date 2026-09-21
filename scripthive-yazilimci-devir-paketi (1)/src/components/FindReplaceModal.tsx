import React, { useState } from 'react';
import { X } from 'lucide-react';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplaceAll: (find: string, replace: string) => void;
  onFindNext?: (find: string) => void;
  onReplaceOne?: (find: string, replace: string) => void;
  theme: 'dark' | 'light';
}

export default function FindReplaceModal({ isOpen, onClose, onReplaceAll, onFindNext, onReplaceOne, theme }: FindReplaceModalProps) {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  if (!isOpen) return null;

  const bgClass = theme === 'dark' ? 'bg-[#1a1f25] text-slate-100 border-[#2d3640]' : 'bg-[#FFFFF0] text-slate-900 border-[#c8bea8]';
  const headerBg = theme === 'dark' ? 'bg-[#20272e] border-[#2d3640]' : 'bg-[#e8e0d5] border-[#c8bea8]';
  const inputBg = theme === 'dark' ? 'bg-[#252c33] border-[#2d3640] text-slate-100 placeholder-slate-500' : 'bg-[#FFFFF0] border-[#c8bea8] text-slate-900 placeholder-slate-400';

  const handleReplaceAll = () => {
    if (!findText) return;
    onReplaceAll(findText, replaceText);
    onClose();
  };

  const handleFindNext = () => {
    if (!findText || !onFindNext) return;
    onFindNext(findText);
  };

  const handleReplaceOne = () => {
    if (!findText || !onReplaceOne) return;
    onReplaceOne(findText, replaceText);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden ${bgClass}`}>
        <div className={`flex items-center justify-between px-4 py-3 border-b ${headerBg}`}>
          <h3 className="font-bold text-sm">Bul ve Değiştir</h3>
          <button onClick={onClose} className={`p-1 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-[#252c33] text-slate-400 hover:text-white' : 'hover:bg-[#dfd7ca] text-slate-600 hover:text-black'}`}>
            <X size={18} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1 opacity-70">Bulunacak Metin</label>
            <input
              type="text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleFindNext();
                }
              }}
              className={`w-full px-3 py-2 rounded-xl border outline-none focus:border-[#6ba3e8] text-sm ${inputBg}`}
              placeholder="Aranacak kelime..."
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold mb-1 opacity-70">Yeni Metin</label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleReplaceOne();
                }
              }}
              className={`w-full px-3 py-2 rounded-xl border outline-none focus:border-[#6ba3e8] text-sm ${inputBg}`}
              placeholder="Yerine konacak kelime..."
            />
          </div>
        </div>

        <div className={`px-4 py-3 border-t flex flex-wrap justify-end gap-2 ${headerBg}`}>
          <button 
            onClick={onClose}
            className={`px-3 py-2 text-xs font-medium rounded-xl mr-auto ${theme === 'dark' ? 'hover:bg-[#252c33] text-slate-300' : 'hover:bg-[#dfd7ca] text-slate-700'}`}
          >
            İptal
          </button>
          <button 
            onClick={handleFindNext}
            disabled={!findText}
            className={`px-3 py-2 text-xs font-medium rounded-xl disabled:opacity-40 transition-colors ${theme === 'dark' ? 'bg-[#252c33] text-slate-200 border border-[#2d3640] hover:bg-[#2d3640]' : 'bg-[#FFFFF0] border border-[#c8bea8] text-slate-800 hover:bg-[#dfd7ca]'}`}
          >
            Bul (Sonraki)
          </button>
          <button 
            onClick={handleReplaceOne}
            disabled={!findText}
            className={`px-3 py-2 text-xs font-medium rounded-xl disabled:opacity-40 transition-colors ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
          >
            Değiştir (Tek Tek)
          </button>
          <button 
            onClick={handleReplaceAll}
            disabled={!findText}
            className={`px-4 py-2 text-xs font-bold rounded-xl disabled:opacity-40 w-full mt-1 transition-colors ${theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 hover:bg-[#82b4f0]' : 'bg-blue-700 text-white hover:bg-blue-800'}`}
          >
            Tümünü Değiştir
          </button>
        </div>
      </div>
    </div>
  );
}
