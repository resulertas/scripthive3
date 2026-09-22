import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Search, Type, Check, RotateCcw, Sparkles, 
  Laptop, DownloadCloud, AlertCircle, Info, ExternalLink, SlidersHorizontal 
} from 'lucide-react';
import { FontOption, GOOGLE_FONTS_LIST } from '../types';
import { safeStorage } from '../lib/storage';

interface FontPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  currentFont: string;
  onSelectFont: (fontFamilyValue: string, applyToAll: boolean) => void;
  hasSelection?: boolean;
}

type CategoryType = 'all' | 'monospace' | 'serif' | 'sans' | 'display' | 'handwriting' | 'system' | 'custom';

// Helper to inject google fonts stylesheet dynamically
export const loadGoogleFontDynamically = (fontName: string) => {
  if (!fontName) return;
  const cleanName = fontName.replace(/['",]/g, '').trim().split(',')[0].trim();
  const systemFonts = [
    'arial', 'helvetica', 'times new roman', 'times', 'georgia', 'garamond', 
    'palatino', 'trebuchet ms', 'verdana', 'monaco', 'menlo', 'consolas', 
    'impact', 'comic sans ms', 'sans-serif', 'serif', 'monospace', 'system-ui'
  ];
  if (systemFonts.includes(cleanName.toLowerCase())) return;

  const formattedFont = cleanName.replace(/\s+/g, '+');
  const id = `gfont-${formattedFont}`;
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${formattedFont}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap`;
    document.head.appendChild(link);
  }
};

const DEFAULT_COURIER = "'Courier Prime', 'Courier New', Courier, monospace";

export default function FontPickerModal({
  isOpen,
  onClose,
  theme,
  currentFont,
  onSelectFont,
  hasSelection = false
}: FontPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [previewFont, setPreviewFont] = useState<string>(currentFont || DEFAULT_COURIER);
  const [applyScope, setApplyScope] = useState<'all' | 'block'>('all');
  
  // Custom Google Font input
  const [customFontInput, setCustomFontInput] = useState('');
  const [customFontsList, setCustomFontsList] = useState<FontOption[]>(() => {
    const saved = safeStorage.getItem('scriptHive_customFonts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  // Local System Fonts (queryLocalFonts API)
  const [systemFontsList, setSystemFontsList] = useState<FontOption[]>([]);
  const [isLoadingSystemFonts, setIsLoadingSystemFonts] = useState(false);
  const [systemFontsScanned, setSystemFontsScanned] = useState(false);
  const [systemFontsError, setSystemFontsError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPreviewFont(currentFont || DEFAULT_COURIER);
      loadGoogleFontDynamically(currentFont || DEFAULT_COURIER);
    }
  }, [isOpen, currentFont]);

  useEffect(() => {
    safeStorage.setItem('scriptHive_customFonts', JSON.stringify(customFontsList));
  }, [customFontsList]);

  // Load preview font if it is a google font
  useEffect(() => {
    loadGoogleFontDynamically(previewFont);
  }, [previewFont]);

  // Add custom Google Font
  const handleAddCustomGoogleFont = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customFontInput.trim();
    if (!trimmed) return;

    // Check if already in list
    const fontVal = `'${trimmed}', sans-serif`;
    const newFontOpt: FontOption = {
      name: trimmed,
      value: fontVal,
      isGoogleFont: true,
      category: 'custom',
      description: 'Özel Eklenen Google Font'
    };

    loadGoogleFontDynamically(trimmed);

    setCustomFontsList(prev => {
      const exists = prev.some(f => f.name.toLowerCase() === trimmed.toLowerCase());
      if (exists) return prev;
      return [newFontOpt, ...prev];
    });

    setPreviewFont(fontVal);
    setCustomFontInput('');
  };

  // Scan local system fonts via Chrome/Edge Local Font Access API
  const handleScanSystemFonts = async () => {
    if (!('queryLocalFonts' in window)) {
      setSystemFontsError('Tarayıcınız sistem fontlarını doğrudan tarama API\'sini (Local Font Access API) desteklemiyor. (Chrome, Edge veya Opera önerilir). Aşağıdaki geniş sistem font listesinden veya özel Google Font ekleme alanından dilediğiniz fontu kullanabilirsiniz.');
      return;
    }

    setIsLoadingSystemFonts(true);
    setSystemFontsError(null);

    try {
      // @ts-ignore
      const availableFonts = await window.queryLocalFonts();
      const uniqueFamilies = new Map<string, FontOption>();

      for (const fontData of availableFonts) {
        const family = fontData.family;
        if (family && !uniqueFamilies.has(family)) {
          uniqueFamilies.set(family, {
            name: family,
            value: `'${family}', sans-serif`,
            isGoogleFont: false,
            category: 'system',
            description: `Sistem Fontu (${fontData.style || 'Yerel'})`
          });
        }
      }

      const list = Array.from(uniqueFamilies.values()).sort((a, b) => a.name.localeCompare(b.name));
      setSystemFontsList(list);
      setSystemFontsScanned(true);
      setSelectedCategory('system');
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setSystemFontsError('Sistem fontlarına erişim izni verilmedi.');
      } else {
        setSystemFontsError(`Sistem fontları taranırken bir hata oluştu: ${err.message || err}`);
      }
    } finally {
      setIsLoadingSystemFonts(false);
    }
  };

  // All combined fonts
  const allAvailableFonts = useMemo(() => {
    const combined: FontOption[] = [...GOOGLE_FONTS_LIST, ...customFontsList];
    
    // Add scanned system fonts
    if (systemFontsList.length > 0) {
      systemFontsList.forEach(sysFont => {
        if (!combined.some(f => f.name.toLowerCase() === sysFont.name.toLowerCase())) {
          combined.push(sysFont);
        }
      });
    }
    return combined;
  }, [customFontsList, systemFontsList]);

  // Filtered fonts
  const filteredFonts = useMemo(() => {
    return allAvailableFonts.filter(font => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'custom' && font.category !== 'custom') return false;
        if (selectedCategory === 'system' && font.category !== 'system') return false;
        if (selectedCategory === 'monospace' && font.category !== 'monospace') return false;
        if (selectedCategory === 'serif' && font.category !== 'serif') return false;
        if (selectedCategory === 'sans' && font.category !== 'sans') return false;
        if (selectedCategory === 'display' && font.category !== 'display') return false;
        if (selectedCategory === 'handwriting' && font.category !== 'handwriting') return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = font.name.toLowerCase().includes(q);
        const matchesDesc = font.description ? font.description.toLowerCase().includes(q) : false;
        const matchesCategory = font.category ? font.category.toLowerCase().includes(q) : false;
        return matchesName || matchesDesc || matchesCategory;
      }

      return true;
    });
  }, [allAvailableFonts, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const bgModal = theme === 'dark' ? 'bg-[#181e24] text-slate-100' : 'bg-[#fcfaf7] text-slate-900';
  const headerBg = theme === 'dark' ? 'bg-[#1e252d] border-b border-slate-700/60' : 'bg-[#f2ece2] border-b border-[#dfd6c7]';
  const cardBg = theme === 'dark' ? 'bg-[#212a33] border-slate-700/70' : 'bg-white border-[#e3dcd1] shadow-sm';
  const cardActiveBg = theme === 'dark' ? 'bg-[#2a3746] border-[#6ba3e8] text-white' : 'bg-blue-50/80 border-blue-600 text-blue-950';
  const inputBg = theme === 'dark' ? 'bg-[#13181d] border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-[#d8d0c2] text-slate-900 placeholder-slate-400';
  const badgeBg = theme === 'dark' ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-100 text-slate-700';

  const categories: { id: CategoryType; label: string; count?: number }[] = [
    { id: 'all', label: 'Tümü' },
    { id: 'monospace', label: 'Daktilo / Monospace (Standart)' },
    { id: 'serif', label: 'Serif (Klasik & Edebi)' },
    { id: 'sans', label: 'Sans-Serif (Modern)' },
    { id: 'display', label: 'Display (Özel Başlık)' },
    { id: 'handwriting', label: 'El Yazısı' },
    { id: 'system', label: 'Sistem Fontları' },
    { id: 'custom', label: `Özel Eklenenler (${customFontsList.length})` },
  ];

  const handleApply = () => {
    onSelectFont(previewFont, applyScope === 'all');
    onClose();
  };

  const handleResetToCourier = () => {
    setPreviewFont(DEFAULT_COURIER);
    onSelectFont(DEFAULT_COURIER, true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`relative w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${
          theme === 'dark' ? 'border-slate-700/80' : 'border-[#d0c6b6]'
        } ${bgModal}`}
      >
        {/* MODAL HEADER */}
        <div className={`flex items-center justify-between px-5 py-4 ${headerBg}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-[#6ba3e8]/20 text-[#6ba3e8]' : 'bg-blue-600/10 text-blue-700'}`}>
              <Type size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">Yazı Tipi & Font Galerisi</h2>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${badgeBg}`}>
                  Google Fonts & Sistem
                </span>
              </div>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Senaryo endüstrisi standardı <strong className={theme === 'dark' ? 'text-[#6ba3e8]' : 'text-blue-700'}>Courier Prime</strong>'dır. Dilediğiniz Google Font veya sistem fontunu tek tıkla uygulayabilirsiniz.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToCourier}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all active:scale-95 ${
                theme === 'dark' 
                  ? 'border-[#2d3640] bg-[#252c33] text-slate-200 hover:bg-[#2d3640]' 
                  : 'border-[#c8bea8] bg-[#f0e8dc] text-slate-800 hover:bg-[#dfd7ca]'
              }`}
              title="Endüstri standardı Courier Prime fontuna sıfırla"
            >
              <RotateCcw size={13} />
              <span>Courier'a Sıfırla</span>
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                theme === 'dark' ? 'hover:bg-slate-700/60 text-slate-400 hover:text-white' : 'hover:bg-[#e4dcce] text-slate-600 hover:text-black'
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* SEARCH & CUSTOM GOOGLE FONT BAR */}
        <div className={`p-4 border-b flex flex-col md:flex-row gap-3 ${theme === 'dark' ? 'border-slate-800 bg-[#151a20]' : 'border-[#e8e0d4] bg-[#f9f7f4]'}`}>
          {/* Live Search */}
          <div className="relative flex-1">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Font adı, stil veya özellik ara (örn: Courier, Garamond, Inter, Retro...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border outline-none transition-all focus:ring-2 focus:ring-blue-500/40 ${inputBg}`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            )}
          </div>

          {/* Load ANY Google Font dynamically */}
          <form onSubmit={handleAddCustomGoogleFont} className="flex gap-2 shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Özel Google Font Adı (örn: Outfit)"
                value={customFontInput}
                onChange={(e) => setCustomFontInput(e.target.value)}
                className={`w-52 sm:w-60 px-3 py-2 text-xs rounded-xl border outline-none transition-all focus:ring-2 focus:ring-blue-500/40 ${inputBg}`}
              />
            </div>
            <button
              type="submit"
              disabled={!customFontInput.trim()}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-white transition-all disabled:opacity-40 shadow-sm ${
                theme === 'dark' 
                  ? 'bg-blue-600 hover:bg-blue-500 active:scale-95' 
                  : 'bg-blue-700 hover:bg-blue-800 active:scale-95'
              }`}
              title="Google Fonts'tan canlı yükle ve listeye ekle"
            >
              <DownloadCloud size={14} />
              <span>Yükle</span>
            </button>
          </form>

          {/* Local System Fonts Scanner Button */}
          <button
            onClick={handleScanSystemFonts}
            disabled={isLoadingSystemFonts}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all shrink-0 ${
              theme === 'dark'
                ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200'
                : 'border-[#d2c8b8] bg-[#f0eae0] hover:bg-[#e6decf] text-slate-800'
            }`}
            title="Bilgisayarınızda yüklü tüm yerel sistem fontlarını tara"
          >
            <Laptop size={14} />
            <span>{isLoadingSystemFonts ? 'Taranıyor...' : systemFontsScanned ? `Sistem Fontları (${systemFontsList.length})` : 'Sistem Fontlarını Tara'}</span>
          </button>
        </div>

        {/* CATEGORY TABS */}
        <div className={`px-4 py-2 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs shrink-0 ${
          theme === 'dark' ? 'border-slate-800/80 bg-[#161c22]' : 'border-[#e8e0d4] bg-[#f4eee4]'
        }`}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all text-xs ${
                selectedCategory === cat.id
                  ? theme === 'dark'
                    ? 'bg-[#6ba3e8] text-slate-950 font-bold shadow-sm'
                    : 'bg-blue-700 text-white font-bold shadow-sm'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-[#eae2d5]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* SYSTEM FONTS ERROR OR INFO BANNER */}
        {systemFontsError && (
          <div className={`mx-4 mt-3 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
            theme === 'dark' ? 'bg-amber-950/40 border-amber-800/60 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}>
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-500" />
            <div className="flex-1">{systemFontsError}</div>
            <button onClick={() => setSystemFontsError(null)} className="opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* MAIN BODY: 2 COLUMNS (FONT LIST & SCREENPLAY PREVIEW) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* LEFT: FONT CARDS GRID */}
          <div className="w-full md:w-1/2 p-4 overflow-y-auto border-r border-slate-700/40 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] px-1 font-semibold opacity-60 uppercase tracking-wider mb-1">
              <span>Yazı Tipleri ({filteredFonts.length})</span>
              <span>Önizlemek İçin Seçin</span>
            </div>

            {filteredFonts.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-3 opacity-60">
                <Search size={32} />
                <p className="text-sm">Aradığınız kriterlere uygun font bulunamadı.</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  className="text-xs text-blue-500 hover:underline font-semibold"
                >
                  Filtreleri Temizle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-2.5">
                {filteredFonts.map((font) => {
                  const isSelected = previewFont === font.value || previewFont.replace(/['",]/g, '').includes(font.name);
                  
                  return (
                    <div
                      key={font.name}
                      onClick={() => setPreviewFont(font.value)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all text-left relative group ${
                        isSelected ? cardActiveBg : `${cardBg} hover:scale-[1.01] hover:shadow-md`
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="font-bold text-sm truncate" title={font.name}>
                          {font.name}
                        </div>
                        {isSelected && (
                          <span className={`p-1 rounded-full shrink-0 ${theme === 'dark' ? 'bg-[#6ba3e8] text-slate-950' : 'bg-blue-600 text-white'}`}>
                            <Check size={12} className="stroke-[3]" />
                          </span>
                        )}
                      </div>

                      {/* Font sample rendering */}
                      <div 
                        className={`text-base truncate my-1.5 opacity-90`}
                        style={{ fontFamily: font.value }}
                      >
                        Sahne 1: İÇ. OFİS - GÜN
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-700/20 text-[10px]">
                        <span className="opacity-60 truncate">
                          {font.description || (font.isGoogleFont ? 'Google Font' : 'Sistem Fontu')}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded font-mono uppercase ${badgeBg}`}>
                          {font.category || (font.isGoogleFont ? 'Google' : 'Sistem')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: LIVE SCREENPLAY PREVIEW CARD */}
          <div className={`w-full md:w-1/2 p-5 overflow-y-auto flex flex-col gap-4 ${
            theme === 'dark' ? 'bg-[#14191f]' : 'bg-[#ede6db]'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                  Canlı Senaryo Önizlemesi
                </span>
              </div>
              <div className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border ${
                theme === 'dark' ? 'bg-slate-800 border-slate-700 text-[#6ba3e8]' : 'bg-white border-[#d2c8b8] text-blue-700'
              }`}>
                {previewFont.split(',')[0].replace(/['"]/g, '')}
              </div>
            </div>

            {/* SCREENPLAY PAGE CARD */}
            <div className={`p-6 rounded-xl border shadow-xl flex flex-col gap-3 min-h-[340px] select-none ${
              theme === 'dark' 
                ? 'bg-[#1b222a] border-slate-700/80 text-slate-200' 
                : 'bg-[#FFFFF0] border-[#c8bea8] text-slate-900'
            }`}>
              {/* Scene Heading */}
              <div 
                className="font-bold uppercase tracking-wide text-sm"
                style={{ fontFamily: previewFont }}
              >
                1 &nbsp; İÇ. SENARİSTİN ÇALIŞMA ODASI - GECE &nbsp; 1
              </div>

              {/* Action */}
              <div 
                className="text-xs leading-relaxed opacity-90"
                style={{ fontFamily: previewFont }}
              >
                Masanın üzerinde duran kahve fincanından hafif bir duman yükselir. Resul ekrandaki senaryoya odaklanmış, klavyenin tuşlarına kararlı bir ritimle basmaktadır.
              </div>

              {/* Character */}
              <div 
                className="text-center font-bold uppercase text-xs mt-2"
                style={{ fontFamily: previewFont }}
              >
                RESUL
              </div>

              {/* Parenthetical */}
              <div 
                className="text-center text-[11px] opacity-80"
                style={{ fontFamily: previewFont }}
              >
                (gülümseyerek, ekrana bakar)
              </div>

              {/* Dialogue */}
              <div 
                className="text-center text-xs leading-relaxed max-w-[80%] mx-auto"
                style={{ fontFamily: previewFont }}
              >
                "Senaryoda doğru font ve ritim, sahnenin ruhunu daha ilk sayfada yönetmene hissettirir."
              </div>

              {/* Transition */}
              <div 
                className="text-right font-bold uppercase text-xs mt-3 opacity-90"
                style={{ fontFamily: previewFont }}
              >
                KESME:
              </div>
            </div>

            {/* FONT INFORMATION & SELECTION SCOPE */}
            <div className={`p-4 rounded-xl border text-xs flex flex-col gap-3 ${
              theme === 'dark' ? 'bg-[#1d252f] border-slate-700/80' : 'bg-white border-[#dcd4c7]'
            }`}>
              <div className="flex items-center gap-2 font-semibold">
                <Info size={15} className="text-blue-500 shrink-0" />
                <span>Uygulama Kapsamı & Standart Bilgisi:</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <label className={`flex-1 flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  applyScope === 'all' 
                    ? theme === 'dark' ? 'bg-blue-600/20 border-blue-500 text-white font-semibold' : 'bg-blue-50 border-blue-600 text-blue-950 font-semibold'
                    : 'border-slate-700/40 opacity-70 hover:opacity-100'
                }`}>
                  <input
                    type="radio"
                    name="applyScope"
                    checked={applyScope === 'all'}
                    onChange={() => setApplyScope('all')}
                    className="accent-blue-600"
                  />
                  <span>Tüm Senaryoya Uygula (Varsayılan)</span>
                </label>

                <label className={`flex-1 flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  applyScope === 'block' 
                    ? theme === 'dark' ? 'bg-blue-600/20 border-blue-500 text-white font-semibold' : 'bg-blue-50 border-blue-600 text-blue-950 font-semibold'
                    : 'border-slate-700/40 opacity-70 hover:opacity-100'
                }`}>
                  <input
                    type="radio"
                    name="applyScope"
                    checked={applyScope === 'block'}
                    onChange={() => setApplyScope('block')}
                    className="accent-blue-600"
                  />
                  <span>Sadece Seçili Bloğa / Elemana Uygula</span>
                </label>
              </div>

              <p className={`text-[11px] leading-normal ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                💡 <strong>İpucu:</strong> Final Draft ve Hollywood standardı 12pt Courier Prime'dır (1 sayfa ≈ 1 dakika kuralı). Ancak özel projeleriniz, tretmanlarınız veya özgün sunumlarınız için tüm Google ve Sistem fontlarını özgürce kullanabilirsiniz.
              </p>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className={`px-5 py-3.5 border-t flex items-center justify-between gap-3 ${headerBg}`}>
          <div className="text-xs opacity-70 truncate hidden sm:block">
            Seçili Yazı Tipi: <strong className="font-mono">{previewFont.split(',')[0].replace(/['"]/g, '')}</strong>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                theme === 'dark' 
                  ? 'border-slate-700 hover:bg-slate-800 text-slate-300' 
                  : 'border-[#d4cab9] hover:bg-[#e4dcce] text-slate-700'
              }`}
            >
              İptal
            </button>
            <button
              onClick={handleApply}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl text-white shadow-lg transition-all active:scale-95 ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20'
                  : 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 shadow-blue-700/20'
              }`}
            >
              <Check size={15} className="stroke-[2.5]" />
              <span>Bu Yazı Tipini Uygula</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
