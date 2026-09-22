import React, { useState, useMemo } from 'react';
import { 
  Palette, X, Check, Sparkles, Eye, User, 
  RotateCcw, Sliders, CheckCircle2, ShieldAlert, SunMedium
} from 'lucide-react';
import { ScreenplayElement } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const TABLE_READ_PALETTE = [
  { id: 'yellow', name: 'Fosforlu Sarı', bgLight: '#fef9c3', bgDark: '#713f12', border: '#eab308', text: '#854d0e', dot: 'bg-yellow-400' },
  { id: 'green', name: 'Neon Yeşil', bgLight: '#dcfce7', bgDark: '#14532d', border: '#22c55e', text: '#166534', dot: 'bg-green-400' },
  { id: 'cyan', name: 'Buz Mavisi', bgLight: '#e0f2fe', bgDark: '#0c4a6e', border: '#0284c7', text: '#075985', dot: 'bg-sky-400' },
  { id: 'pink', name: 'Neon Pembe', bgLight: '#fce7f3', bgDark: '#701a75', border: '#ec4899', text: '#9d174d', dot: 'bg-pink-400' },
  { id: 'orange', name: 'Pastel Turuncu', bgLight: '#ffedd5', bgDark: '#7c2d12', border: '#f97316', text: '#9a3412', dot: 'bg-orange-400' },
  { id: 'purple', name: 'Lavanta / Mor', bgLight: '#f3e8ff', bgDark: '#4c1d95', border: '#a855f7', text: '#6b21a8', dot: 'bg-purple-400' },
  { id: 'teal', name: 'Turkuaz', bgLight: '#ccfbf1', bgDark: '#134e4a', border: '#14b8a6', text: '#115e59', dot: 'bg-teal-400' },
  { id: 'coral', name: 'Mercan Kırmızısı', bgLight: '#ffe4e6', bgDark: '#881337', border: '#f43f5e', text: '#9f1239', dot: 'bg-rose-400' }
];

interface TableReadModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: ScreenplayElement[];
  isTableReadMode: boolean;
  setIsTableReadMode: (enabled: boolean) => void;
  characterColors: Record<string, string>;
  setCharacterColors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  spotlightCharacter: string | null;
  setSpotlightCharacter: (char: string | null) => void;
  theme: 'dark' | 'light';
}

export default function TableReadModal({
  isOpen,
  onClose,
  elements,
  isTableReadMode,
  setIsTableReadMode,
  characterColors,
  setCharacterColors,
  spotlightCharacter,
  setSpotlightCharacter,
  theme
}: TableReadModalProps) {
  // Extract all characters and rank by line count
  const characterStats = useMemo(() => {
    const map: Record<string, { count: number; name: string }> = {};
    elements.forEach(el => {
      if (el.type === 'character') {
        const cleaned = el.content.replace(/\(.*\)/g, '').trim().toLocaleUpperCase('tr-TR');
        if (cleaned) {
          if (!map[cleaned]) map[cleaned] = { count: 0, name: cleaned };
          map[cleaned].count += 1;
        }
      }
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [elements]);

  // Auto assign distinct palette colors to top characters
  const handleAutoAssignColors = () => {
    const newColors: Record<string, string> = {};
    characterStats.forEach((char, idx) => {
      const paletteItem = TABLE_READ_PALETTE[idx % TABLE_READ_PALETTE.length];
      newColors[char.name] = paletteItem.id;
    });
    setCharacterColors(newColors);
  };

  const handleSelectColor = (charName: string, colorId: string) => {
    setCharacterColors(prev => ({
      ...prev,
      [charName]: colorId
    }));
  };

  const handleClearColors = () => {
    setCharacterColors({});
  };

  if (!isOpen) return null;

  const bgModal = theme === 'dark' ? 'bg-[#20272e] text-slate-100 border-[#2d3640]' : 'bg-[#FFFFF0] text-slate-800 border-[#c8bea8]';
  const cardBg = theme === 'dark' ? 'bg-[#1a1f25] border-[#2d3640]' : 'bg-white border-[#c8bea8]';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-4xl h-[86vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${bgModal}`}
        >
          {/* HEADER */}
          <div className={`px-6 py-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-[#2d3640] bg-[#1a1f25]' : 'border-[#c8bea8] bg-[#e8e0d5]'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-[#6ba3e8]/20 text-[#6ba3e8]' : 'bg-blue-600/10 text-blue-700'}`}>
                <Palette size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight">Karakter Renk Vurgulama & Masa Okuma Modu</h2>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-[#6ba3e8]/20 text-[#6ba3e8]' : 'bg-blue-100 text-blue-800'}`}>
                    Table Read
                  </span>
                </div>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Masa okumalarında ve oyuncu provalarında karakter repliklerini fosforlu renklerle ayırın.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-700/60 text-slate-400 hover:text-white' : 'hover:bg-[#dfd7ca] text-slate-600 hover:text-black'}`}
              title="Kapat"
            >
              <X size={20} />
            </button>
          </div>

          {/* MASTER CONTROLS */}
          <div className={`p-4 sm:p-6 border-b space-y-4 ${theme === 'dark' ? 'bg-[#1a1f25] border-[#2d3640]' : 'bg-[#e8e0d5] border-[#c8bea8]'}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Table Read Master Toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsTableReadMode(!isTableReadMode)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    isTableReadMode ? (theme === 'dark' ? 'bg-[#6ba3e8]' : 'bg-blue-700') : theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform shadow-md ${
                      isTableReadMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div>
                  <div className="text-xs font-bold">Masa Okuma Modu (Table Read Highlighter)</div>
                  <div className="text-[11px] opacity-70">
                    {isTableReadMode ? 'Aktif: Editörde replikler renkli parlayacak' : 'Devre Dışı: Standart editör görünümü'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoAssignColors}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    theme === 'dark' 
                      ? 'bg-[#6ba3e8]/15 text-[#6ba3e8] hover:bg-[#6ba3e8]/25 border-[#6ba3e8]/30' 
                      : 'bg-blue-600/10 text-blue-700 hover:bg-blue-600/20 border-blue-300'
                  }`}
                  title="En çok konuşan karakterlere otomatik farklı renkler ata"
                >
                  <Sparkles size={13} />
                  <span>Otomatik Renklendir</span>
                </button>
                <button
                  onClick={handleClearColors}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    theme === 'dark' ? 'border-[#2d3640] hover:bg-[#252c33] text-slate-300' : 'border-[#c8bea8] hover:bg-[#dfd7ca] text-slate-700'
                  }`}
                  title="Tüm renk atamalarını sıfırla"
                >
                  <RotateCcw size={12} />
                  <span>Temizle</span>
                </button>
              </div>
            </div>

            {/* Spotlight Character Selector */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs font-semibold opacity-80 flex items-center gap-1.5">
                <Eye size={14} />
                <span>Oyuncu Odak Modu (Spotlight):</span>
              </span>
              <select
                value={spotlightCharacter || ''}
                onChange={(e) => setSpotlightCharacter(e.target.value || null)}
                className={`px-3 py-1.5 text-xs rounded-xl border outline-none font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-[#14181c] border-[#2d3640] text-slate-100 focus:border-[#6ba3e8]'
                    : 'bg-white border-[#c8bea8] text-slate-900 focus:border-blue-700'
                }`}
              >
                <option value="">Tüm Karakterleri Göster (Varsayılan)</option>
                {characterStats.map(c => (
                  <option key={c.name} value={c.name}>Sadece "{c.name}" Parlasın (Diğerlerini Soluklaştır)</option>
                ))}
              </select>
            </div>
          </div>

          {/* CHARACTER COLOR ASSIGNMENT LIST */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
            {characterStats.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                <User size={38} className="mb-2 text-slate-400" />
                <p className="text-sm font-semibold">Senaryoda henüz karakter bulunamadı.</p>
              </div>
            ) : (
              characterStats.map(char => {
                const activeColorId = characterColors[char.name] || 'yellow';
                const hasExplicitColor = !!characterColors[char.name];

                return (
                  <div
                    key={char.name}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${cardBg} shadow-sm`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
                        {char.name.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-xs flex items-center gap-2">
                          <span>{char.name}</span>
                          <span className="text-[11px] opacity-60 font-normal">({char.count} Replik)</span>
                        </div>
                        <div className="text-[11px] opacity-50">
                          {hasExplicitColor ? 'Özel renk atandı' : 'Varsayılan sarı vurgu'}
                        </div>
                      </div>
                    </div>

                    {/* Palette Picker */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {TABLE_READ_PALETTE.map(colorOpt => {
                        const isSelected = activeColorId === colorOpt.id;
                        return (
                          <button
                            key={colorOpt.id}
                            onClick={() => handleSelectColor(char.name, colorOpt.id)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${colorOpt.dot} ${
                              isSelected
                                ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 shadow-md'
                                : 'opacity-60 hover:opacity-100 hover:scale-105'
                            }`}
                            title={colorOpt.name}
                          >
                            {isSelected && <Check size={14} className="text-black stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* FOOTER */}
          <div className={`px-6 py-3.5 border-t flex items-center justify-between ${theme === 'dark' ? 'border-slate-800 bg-[#141820]' : 'border-[#dfd6c5] bg-[#ece4d6]'}`}>
            <div className="text-xs opacity-80 flex items-center gap-1.5">
              <SunMedium size={14} className={theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700'} />
              <span>Renkler editörde, yazdırma çıktısında ve <b>Word (.docx)</b> dosyalarında otomatik kaydedilir ve korunur.</span>
            </div>

            <button
              onClick={onClose}
              className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 ${theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950 hover:bg-[#82b4f0]' : 'bg-blue-700 hover:bg-blue-800 text-white'}`}
            >
              Tamam
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
